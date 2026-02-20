using System.Text;
using System.Text.Json;
using DadiChatBot.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker.Http;
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

    public User? ExtractUserFromHeaders(HttpRequestData request)
    {
        if (!request.Headers.TryGetValues("x-ms-client-principal", out var userHeaders) || !userHeaders.Any())
        {
            _logger.LogDebug("x-ms-client-principal header not found");
            
            var bypassAuth = Environment.GetEnvironmentVariable("BYPASS_AUTH_FOR_LOCAL_DEV");
            if (!string.IsNullOrEmpty(bypassAuth) && bypassAuth.Equals("true", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("BYPASS_AUTH_FOR_LOCAL_DEV enabled - returning fake user");
                return new User
                {
                    UserId = "local-dev-user",
                    IdentityProvider = "local",
                    UserDetails = "{\"email\":\"dev@local.test\",\"name\":\"Local Dev User\"}",
                    Claims = new[]
                    {
                        new UserClaim { Typ = "email", Val = "dev@local.test" },
                        new UserClaim { Typ = "name", Val = "Local Dev User" }
                    }
                };
            }
            
            return null;
        }

        try
        {
            var userHeader = userHeaders.First();
            var decodedBytes = Convert.FromBase64String(userHeader);
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
            // First, try to extract email from Claims array
            if (user.Claims != null && user.Claims.Length > 0)
            {
                _logger.LogInformation("Searching through {Count} claims for email", user.Claims.Length);
                
                // Look for the standard email claim type
                var emailClaim = user.Claims.FirstOrDefault(c => 
                    c.Typ == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" ||
                    c.Typ == "email" ||
                    c.Typ.EndsWith("/emailaddress", StringComparison.OrdinalIgnoreCase));
                
                if (emailClaim != null && !string.IsNullOrEmpty(emailClaim.Val))
                {
                    _logger.LogInformation("Email found in claims: {Email}", emailClaim.Val);
                    return emailClaim.Val;
                }
            }
            
            // Fallback: try UserDetails JSON
            if (!string.IsNullOrEmpty(user.UserDetails))
            {
                var claims = JsonSerializer.Deserialize<UserClaims>(user.UserDetails, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (!string.IsNullOrEmpty(claims?.Email))
                {
                    _logger.LogInformation("Email found in UserDetails: {Email}", claims.Email);
                    return claims.Email;
                }
            }

            // Last resort: use UserId
            _logger.LogWarning("No email found in claims or UserDetails, using UserId: {UserId}", user.UserId);
            return user.UserId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract email from user");
            return user.UserId;
        }
    }

    public string? GetUserName(User? user)
    {
        if (user == null)
        {
            return null;
        }

        try
        {
            // Try to extract name from Claims array
            if (user.Claims != null && user.Claims.Length > 0)
            {
                var nameClaim = user.Claims.FirstOrDefault(c => 
                    c.Typ == "name" ||
                    c.Typ == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" ||
                    c.Typ.EndsWith("/name", StringComparison.OrdinalIgnoreCase));
                
                if (nameClaim != null && !string.IsNullOrEmpty(nameClaim.Val))
                {
                    _logger.LogInformation("Name found in claims: {Name}", nameClaim.Val);
                    return nameClaim.Val;
                }
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract name from user");
            return null;
        }
    }

    public bool IsWhitelisted(string? email)
    {
        if (string.IsNullOrEmpty(email))
        {
            return false;
        }

        var bypassAuth = Environment.GetEnvironmentVariable("BYPASS_AUTH_FOR_LOCAL_DEV");
        if (!string.IsNullOrEmpty(bypassAuth) && bypassAuth.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("BYPASS_AUTH_FOR_LOCAL_DEV enabled - allowing access for {Email}", email);
            return true;
        }

        if (_whitelistedEmails.Length == 0)
        {
            _logger.LogWarning("Whitelist is empty, denying access");
            return false;
        }

        return _whitelistedEmails.Contains(email.ToLowerInvariant());
    }
}
