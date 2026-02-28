using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DadiChatBot.Models;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Services;

public class GitHubService
{
    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly JsonSerializerOptions CaseInsensitiveOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly ILogger<GitHubService> _logger;
    private readonly HttpClient _http;
    private readonly string? _token;

    private const string Repo = "holen82/askdadi";

    public GitHubService(ILogger<GitHubService> logger)
    {
        _logger = logger;
        _token = Environment.GetEnvironmentVariable("GITHUB_TOKEN");

        _http = new HttpClient();
        _http.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DadiChatBot", "1.0"));
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        _http.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

        if (!string.IsNullOrEmpty(_token))
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
    }

    public bool IsConfigured() => !string.IsNullOrEmpty(_token);

    public async Task<string> CreateIssueAsync(string title, CancellationToken cancellationToken)
    {
        if (!IsConfigured())
            throw new InvalidOperationException("GitHub token not configured.");

        var body = JsonSerializer.Serialize(new
        {
            title,
            labels = new[] { "from-chat" }
        }, CamelCaseOptions);

        var response = await _http.PostAsync(
            $"https://api.github.com/repos/{Repo}/issues",
            new StringContent(body, Encoding.UTF8, "application/json"),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("GitHub API error {Status}: {Error}", response.StatusCode, error);
            throw new InvalidOperationException($"GitHub API returned {(int)response.StatusCode}.");
        }

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return doc.RootElement.GetProperty("html_url").GetString()
               ?? throw new InvalidOperationException("Missing html_url in GitHub response.");
    }

    public async Task<List<GitHubIssue>> GetIssuesForAutoResolveAsync(CancellationToken ct = default)
    {
        var response = await _http.GetAsync(
            $"https://api.github.com/repos/{Repo}/issues?labels=from-chat&state=open&per_page=50",
            ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var issues = JsonSerializer.Deserialize<List<GitHubIssue>>(json, CaseInsensitiveOptions) ?? [];
        return issues.Where(i => !i.Labels.Any(l => l.Name == "autoresolve")).ToList();
    }

    public async Task AddLabelToIssueAsync(int issueNumber, string label, CancellationToken ct = default)
    {
        var body = JsonSerializer.Serialize(new { labels = new[] { label } }, CamelCaseOptions);
        var response = await _http.PostAsync(
            $"https://api.github.com/repos/{Repo}/issues/{issueNumber}/labels",
            new StringContent(body, Encoding.UTF8, "application/json"),
            ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task PostIssueCommentAsync(int issueNumber, string body, CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(new { body }, CamelCaseOptions);
        var response = await _http.PostAsync(
            $"https://api.github.com/repos/{Repo}/issues/{issueNumber}/comments",
            new StringContent(payload, Encoding.UTF8, "application/json"),
            ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task<List<GitHubTreeItem>> GetRepoTreeAsync(CancellationToken ct = default)
    {
        var response = await _http.GetAsync(
            $"https://api.github.com/repos/{Repo}/git/trees/master?recursive=1",
            ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var tree = JsonSerializer.Deserialize<GitHubTreeResponse>(json, CaseInsensitiveOptions);
        return tree?.Tree ?? [];
    }

    public async Task<string> GetBlobContentAsync(string sha, CancellationToken ct = default)
    {
        var response = await _http.GetAsync(
            $"https://api.github.com/repos/{Repo}/git/blobs/{sha}",
            ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var blob = JsonSerializer.Deserialize<GitHubBlobResponse>(json, CaseInsensitiveOptions);

        if (blob?.Encoding == "base64" && !string.IsNullOrEmpty(blob.Content))
        {
            var normalized = blob.Content.Replace("\n", "").Replace("\r", "");
            return Encoding.UTF8.GetString(Convert.FromBase64String(normalized));
        }
        return blob?.Content ?? string.Empty;
    }

    public async Task<string> GetHeadShaAsync(CancellationToken ct = default)
    {
        var response = await _http.GetAsync(
            $"https://api.github.com/repos/{Repo}/git/ref/heads/master",
            ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("object").GetProperty("sha").GetString()
               ?? throw new InvalidOperationException("Missing SHA in git ref response.");
    }

    public async Task CreateBranchAsync(string branchName, string baseSha, CancellationToken ct = default)
    {
        var body = JsonSerializer.Serialize(new
        {
            @ref = $"refs/heads/{branchName}",
            sha = baseSha
        }, CamelCaseOptions);
        var response = await _http.PostAsync(
            $"https://api.github.com/repos/{Repo}/git/refs",
            new StringContent(body, Encoding.UTF8, "application/json"),
            ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task<string?> GetFileShaAsync(string filePath, string branchName, CancellationToken ct = default)
    {
        var response = await _http.GetAsync(
            $"https://api.github.com/repos/{Repo}/contents/{filePath}?ref={branchName}",
            ct);

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return null;

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("sha").GetString();
    }

    public async Task UpsertFileAsync(
        string filePath,
        string content,
        string commitMessage,
        string branchName,
        string? existingFileSha,
        CancellationToken ct = default)
    {
        var payload = new Dictionary<string, object?>
        {
            ["message"] = commitMessage,
            ["content"] = Convert.ToBase64String(Encoding.UTF8.GetBytes(content)),
            ["branch"] = branchName
        };
        if (!string.IsNullOrEmpty(existingFileSha))
            payload["sha"] = existingFileSha;

        var body = JsonSerializer.Serialize(payload, CamelCaseOptions);
        var response = await _http.PutAsync(
            $"https://api.github.com/repos/{Repo}/contents/{filePath}",
            new StringContent(body, Encoding.UTF8, "application/json"),
            ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task<string> CreatePullRequestAsync(
        string title,
        string body,
        string headBranch,
        CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(new
        {
            title,
            body,
            head = headBranch,
            @base = "master"
        }, CamelCaseOptions);
        var response = await _http.PostAsync(
            $"https://api.github.com/repos/{Repo}/pulls",
            new StringContent(payload, Encoding.UTF8, "application/json"),
            ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("html_url").GetString()
               ?? throw new InvalidOperationException("Missing html_url in pull request response.");
    }
}
