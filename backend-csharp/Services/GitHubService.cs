using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Services;

public class GitHubService
{
    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
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
}
