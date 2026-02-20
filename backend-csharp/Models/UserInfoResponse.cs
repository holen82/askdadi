namespace DadiChatBot.Models;

public class UserInfoResponse
{
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public bool IsAuthenticated { get; set; }
}
