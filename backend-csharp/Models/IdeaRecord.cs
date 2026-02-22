namespace DadiChatBot.Models;

public class IdeaRecord
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
}

public class SubmitIdeaRequest
{
    public string Text { get; set; } = string.Empty;
}

public class SubmitIdeaResponse
{
    public string Id { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
