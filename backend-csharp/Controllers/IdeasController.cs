using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class IdeasController(
    ILogger<IdeasController> logger,
    AuthService authService,
    IdeaStorageService ideaStorageService) : ControllerBase
{
    [HttpGet("ideas")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var user = authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = authService.GetUserEmail(user);
        if (!authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        try
        {
            var ideas = await ideaStorageService.ListIdeasAsync(cancellationToken);
            return Ok(ideas);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error listing ideas");
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }

    [HttpPost("ideas")]
    public async Task<IActionResult> Submit([FromBody] SubmitIdeaRequest? request, CancellationToken cancellationToken)
    {
        var user = authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = authService.GetUserEmail(user);
        if (!authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        if (request == null || string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "Text is required" });

        if (request.Text.Length > 500)
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "Text must be 500 characters or fewer" });

        try
        {
            var name = authService.GetUserName(user) ?? email ?? "Unknown";
            var record = await ideaStorageService.SaveIdeaAsync(request.Text, name, email ?? "unknown", cancellationToken);
            return StatusCode(201, new SubmitIdeaResponse { Id = record.Id, Message = "Idé lagret." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error saving idea");
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }

    [HttpDelete("ideas/{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var user = authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = authService.GetUserEmail(user);
        if (!authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        try
        {
            var existed = await ideaStorageService.DeleteIdeaAsync(id, cancellationToken);
            if (!existed)
                return NotFound(new ErrorResponse { Error = "Not Found", Message = "Idea not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting idea {Id}", id);
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }
}
