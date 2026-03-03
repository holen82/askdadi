using System.Text.Json;
using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class IssuesController : ControllerBase
{
    private readonly ILogger<IssuesController> _logger;
    private readonly AuthService _authService;
    private readonly GitHubService _gitHubService;

    public IssuesController(
        ILogger<IssuesController> logger,
        AuthService authService,
        GitHubService gitHubService)
    {
        _logger = logger;
        _authService = authService;
        _gitHubService = gitHubService;
    }

    [HttpPost("issues")]
    public async Task<IActionResult> Create([FromBody] CreateIssueRequest? request, CancellationToken cancellationToken)
    {
        var user = _authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = _authService.GetUserEmail(user);
        if (!_authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        if (request == null || string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "Title is required" });

        if (request.Title.Length > 256)
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "Title must be 256 characters or fewer" });

        if (!_gitHubService.IsConfigured())
            return StatusCode(503, new ErrorResponse { Error = "Service Unavailable", Message = "GitHub integration not configured" });

        try
        {
            var name = _authService.GetUserName(user) ?? email ?? "Unknown";
            var issueUrl = await _gitHubService.CreateIssueAsync(request.Title, cancellationToken);
            _logger.LogInformation("Issue created by {Name}: {Url}", name, issueUrl);

            return StatusCode(201, new CreateIssueResponse { Url = issueUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating GitHub issue");
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }
}
