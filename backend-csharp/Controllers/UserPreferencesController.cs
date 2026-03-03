using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class UserPreferencesController : ControllerBase
{
    private readonly ILogger<UserPreferencesController> _logger;
    private readonly AuthService _authService;
    private readonly UserPreferencesService _userPreferencesService;

    public UserPreferencesController(
        ILogger<UserPreferencesController> logger,
        AuthService authService,
        UserPreferencesService userPreferencesService)
    {
        _logger = logger;
        _authService = authService;
        _userPreferencesService = userPreferencesService;
    }

    [HttpGet("userprefs/chatmode")]
    public async Task<IActionResult> GetChatMode(CancellationToken cancellationToken)
    {
        var user = _authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = _authService.GetUserEmail(user);
        if (!_authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        try
        {
            var prefs = await _userPreferencesService.GetPreferencesAsync(user.UserId, cancellationToken);
            return Ok(new ChatModeResponse { ChatMode = prefs.ChatMode });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat mode for user {UserId}", user.UserId);
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }

    [HttpPut("userprefs/chatmode")]
    public async Task<IActionResult> SetChatMode([FromBody] SetChatModeRequest? request, CancellationToken cancellationToken)
    {
        var user = _authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = _authService.GetUserEmail(user);
        if (!_authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        if (request == null || (request.ChatMode != "fun" && request.ChatMode != "normal"))
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "chatMode must be 'fun' or 'normal'" });

        try
        {
            var prefs = await _userPreferencesService.SetChatModeAsync(user.UserId, request.ChatMode, cancellationToken);
            return Ok(new ChatModeResponse { ChatMode = prefs.ChatMode });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting chat mode for user {UserId}", user.UserId);
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }
}
