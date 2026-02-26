using System.Text.Json.Serialization;

namespace DadiChatBot.Models;

public class ChatResponse
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}
