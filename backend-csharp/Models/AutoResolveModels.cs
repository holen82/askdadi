using System.Text.Json.Serialization;

namespace DadiChatBot.Models;

public class GitHubIssue
{
    [JsonPropertyName("number")]
    public int Number { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("body")]
    public string? Body { get; set; }

    [JsonPropertyName("labels")]
    public List<GitHubLabel> Labels { get; set; } = [];
}

public class GitHubLabel
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class GitHubTreeResponse
{
    [JsonPropertyName("tree")]
    public List<GitHubTreeItem> Tree { get; set; } = [];
}

public class GitHubTreeItem
{
    [JsonPropertyName("path")]
    public string Path { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("sha")]
    public string Sha { get; set; } = string.Empty;
}

public class GitHubBlobResponse
{
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("encoding")]
    public string Encoding { get; set; } = string.Empty;
}

public class AiCodeChangesResponse
{
    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;

    [JsonPropertyName("fileChanges")]
    public Dictionary<string, string> FileChanges { get; set; } = [];
}

public record SourceFile(string Path, string Content);
