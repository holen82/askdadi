using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class UserController(ILogger<UserController> logger, AuthService authService) : ControllerBase
{
    [HttpGet("user")]
    public IActionResult Get()
    {
        logger.LogInformation("User info request received");

        var user = authService.ExtractUserFromHeaders(Request);

        if (user == null)
        {
            logger.LogWarning("No user found in request headers");
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });
        }

        var email = authService.GetUserEmail(user);

        if (!authService.IsWhitelisted(email))
        {
            logger.LogWarning("User not whitelisted: {Email}", email);
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized to access this application" });
        }

        logger.LogInformation("User authenticated successfully: {Email}", email);

        var name = authService.GetUserName(user);

        return Ok(new UserInfoResponse
        {
            Email = email ?? string.Empty,
            Name = name,
            Provider = user.IdentityProvider,
            UserId = user.UserId,
            IsAuthenticated = true
        });
    }
}
