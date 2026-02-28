namespace DadiChatBot.Models;

public class CreateIssueRequest
{
    public string Title { get; set; } = string.Empty;
}

public class CreateIssueResponse
{
    public string Url { get; set; } = string.Empty;
}
