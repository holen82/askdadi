namespace DadiChatBot.Models;

public class ChatRequest
{
    public ChatMessage[] Messages { get; set; } = Array.Empty<ChatMessage>();
}

public class ChatMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
