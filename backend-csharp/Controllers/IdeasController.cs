using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class IdeasController : ControllerBase
{
    private readonly ILogger<IdeasController> _logger;
    private readonly AuthService _authService;
    private readonly IdeaStorageService _ideaStorageService;

    public IdeasController(
        ILogger<IdeasController> logger,
        AuthService authService,
        IdeaStorageService ideaStorageService)
    {
        _logger = logger;
        _authService = authService;
        _ideaStorageService = ideaStorageService;
    }

    [HttpGet("ideas")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var user = _authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = _authService.GetUserEmail(user);
        if (!_authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        try
        {
            var ideas = await _ideaStorageService.ListIdeasAsync(cancellationToken);
            return Ok(ideas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing ideas");
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }

    [HttpPost("ideas")]
    public async Task<IActionResult> Submit([FromBody] SubmitIdeaRequest? request, CancellationToken cancellationToken)
    {
        var user = _authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = _authService.GetUserEmail(user);
        if (!_authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        if (request == null || string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "Text is required" });

        if (request.Text.Length > 500)
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "Text must be 500 characters or fewer" });

        try
        {
            var name = _authService.GetUserName(user) ?? email ?? "Unknown";
            var record = await _ideaStorageService.SaveIdeaAsync(request.Text, name, email ?? "unknown", cancellationToken);
            return StatusCode(201, new SubmitIdeaResponse { Id = record.Id, Message = "Idé lagret." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving idea");
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }

    [HttpDelete("ideas/{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var user = _authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = _authService.GetUserEmail(user);
        if (!_authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        try
        {
            var existed = await _ideaStorageService.DeleteIdeaAsync(id, cancellationToken);
            if (!existed)
                return NotFound(new ErrorResponse { Error = "Not Found", Message = "Idea not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting idea {Id}", id);
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }
}
