using System.Text;
using System.Text.Json;
using DadiChatBot.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Services;

public class AuthService
{
    private readonly ILogger<AuthService> _logger;
    private readonly string[] _whitelistedEmails;

    public AuthService(ILogger<AuthService> logger)
    {
        _logger = logger;
        
        var whitelistedEmailsEnv = Environment.GetEnvironmentVariable("WHITELISTED_EMAILS") ?? string.Empty;
        if (string.IsNullOrWhiteSpace(whitelistedEmailsEnv))
        {
            _logger.LogWarning("WHITELISTED_EMAILS environment variable is not set");
            _whitelistedEmails = Array.Empty<string>();
        }
        else
        {
            _whitelistedEmails = whitelistedEmailsEnv
                .Split(',')
                .Select(e => e.Trim().ToLowerInvariant())
                .Where(e => !string.IsNullOrEmpty(e))
                .ToArray();
        }
    }

    public User? ExtractUserFromHeaders(HttpRequest request)
    {
        if (!request.Headers.TryGetValue("x-ms-client-principal", out var userHeader))
        {
            _logger.LogDebug("x-ms-client-principal header not found");
            return null;
        }

        try
        {
            var decodedBytes = Convert.FromBase64String(userHeader.ToString());
            var decodedUser = Encoding.UTF8.GetString(decodedBytes);
            
            // Log the full decoded JSON to see what we're getting
            _logger.LogInformation("Decoded user principal: {UserPrincipal}", decodedUser);
            
            var user = JsonSerializer.Deserialize<User>(decodedUser, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            if (user != null)
            {
                _logger.LogInformation("Parsed user - UserId: {UserId}, Provider: {Provider}, UserDetails present: {HasDetails}", 
                    user.UserId, user.IdentityProvider, !string.IsNullOrEmpty(user.UserDetails));
            }
            
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse user header");
            return null;
        }
    }

    public string? GetUserEmail(User? user)
    {
        if (user == null)
        {
            return null;
        }

        try
        {
            if (!string.IsNullOrEmpty(user.UserDetails))
            {
                var claims = JsonSerializer.Deserialize<UserClaims>(user.UserDetails, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (!string.IsNullOrEmpty(claims?.Email))
                {
                    return claims.Email;
                }
            }

            return user.UserId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract email from user details");
            return user.UserId;
        }
    }

    public bool IsWhitelisted(string? email)
    {
        if (string.IsNullOrEmpty(email))
        {
            return false;
        }

        if (_whitelistedEmails.Length == 0)
        {
            _logger.LogWarning("Whitelist is empty, denying access");
            return false;
        }

        return _whitelistedEmails.Contains(email.ToLowerInvariant());
    }
}
