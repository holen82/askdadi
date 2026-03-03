using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;
    private readonly AuthService _authService;

    public UserController(ILogger<UserController> logger, AuthService authService)
    {
        _logger = logger;
        _authService = authService;
    }

    [HttpGet("user")]
    public IActionResult Get()
    {
        _logger.LogInformation("User info request received");

        var user = _authService.ExtractUserFromHeaders(Request);

        if (user == null)
        {
            _logger.LogWarning("No user found in request headers");
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });
        }

        var email = _authService.GetUserEmail(user);

        if (!_authService.IsWhitelisted(email))
        {
            _logger.LogWarning("User not whitelisted: {Email}", email);
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized to access this application" });
        }

        _logger.LogInformation("User authenticated successfully: {Email}", email);

        var name = _authService.GetUserName(user);

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
