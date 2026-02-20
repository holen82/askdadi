namespace DadiChatBot.Models;

public class User
{
    public string UserId { get; set; } = string.Empty;
    public string IdentityProvider { get; set; } = string.Empty;
    public string UserDetails { get; set; } = string.Empty;
    public string[] UserRoles { get; set; } = Array.Empty<string>();
    public UserClaim[] Claims { get; set; } = Array.Empty<UserClaim>();
}

public class UserClaim
{
    public string Typ { get; set; } = string.Empty;
    public string Val { get; set; } = string.Empty;
}

public class UserClaims
{
    public string? Email { get; set; }
}
