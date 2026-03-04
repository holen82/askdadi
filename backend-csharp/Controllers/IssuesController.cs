using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class IssuesController(
    ILogger<IssuesController> logger,
    AuthService authService,
    GitHubService gitHubService,
    AutoResolveService autoResolveService) : ControllerBase
{
    [HttpPost("issues")]
    public async Task<IActionResult> Create([FromBody] CreateIssueRequest? request, CancellationToken cancellationToken)
    {
        var user = authService.ExtractUserFromHeaders(Request);
        if (user == null)
            return Unauthorized(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });

        var email = authService.GetUserEmail(user);
        if (!authService.IsWhitelisted(email))
            return StatusCode(403, new ErrorResponse { Error = "Forbidden", Message = "User not authorized" });

        if (request == null || string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new ErrorResponse { Error = "Bad Request", Message = "Title is required" });

        if (!gitHubService.IsConfigured())
            return StatusCode(503, new ErrorResponse { Error = "Service Unavailable", Message = "GitHub integration not configured" });

        try
        {
            var name = authService.GetUserName(user) ?? email ?? "Unknown";
            var (issueNumber, issueUrl, issueBody) = await gitHubService.CreateIssueAsync(request.Title, cancellationToken);
            logger.LogInformation("Issue created by {Name}: #{Number} {Url}", name, issueNumber, issueUrl);

            var issue = new GitHubIssue { Number = issueNumber, Title = request.Title, Body = issueBody };
            _ = Task.Run(() => autoResolveService.ProcessSingleIssueAsync(issue, CancellationToken.None));

            return StatusCode(201, new CreateIssueResponse { Url = issueUrl });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating GitHub issue");
            return StatusCode(500, new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
        }
    }
}
