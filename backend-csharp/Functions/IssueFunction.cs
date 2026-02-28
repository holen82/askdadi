using System.Text.Json;
using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Functions;

public class IssueFunction
{
    private readonly ILogger<IssueFunction> _logger;
    private readonly AuthService _authService;
    private readonly GitHubService _gitHubService;

    public IssueFunction(
        ILogger<IssueFunction> logger,
        AuthService authService,
        GitHubService gitHubService)
    {
        _logger = logger;
        _authService = authService;
        _gitHubService = gitHubService;
    }

    [Function("createIssue")]
    public async Task<HttpResponseData> Create(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "issues")]
        HttpRequestData req,
        CancellationToken cancellationToken)
    {
        var user = _authService.ExtractUserFromHeaders(req);
        if (user == null)
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.Unauthorized);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" }, cancellationToken);
            return r;
        }

        var email = _authService.GetUserEmail(user);
        if (!_authService.IsWhitelisted(email))
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.Forbidden);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Forbidden", Message = "User not authorized" }, cancellationToken);
            return r;
        }

        CreateIssueRequest? request;
        try
        {
            request = await JsonSerializer.DeserializeAsync<CreateIssueRequest>(
                req.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                cancellationToken);
        }
        catch
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Bad Request", Message = "Invalid request body" }, cancellationToken);
            return r;
        }

        if (request == null || string.IsNullOrWhiteSpace(request.Title))
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Bad Request", Message = "Title is required" }, cancellationToken);
            return r;
        }

        if (request.Title.Length > 256)
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Bad Request", Message = "Title must be 256 characters or fewer" }, cancellationToken);
            return r;
        }

        if (!_gitHubService.IsConfigured())
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.ServiceUnavailable);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Service Unavailable", Message = "GitHub integration not configured" }, cancellationToken);
            return r;
        }

        try
        {
            var name = _authService.GetUserName(user) ?? email ?? "Unknown";
            var issueUrl = await _gitHubService.CreateIssueAsync(request.Title, cancellationToken);
            _logger.LogInformation("Issue created by {Name}: {Url}", name, issueUrl);

            var okResponse = req.CreateResponse(System.Net.HttpStatusCode.Created);
            okResponse.Headers.Add("Content-Type", "application/json");
            await okResponse.WriteStringAsync(JsonSerializer.Serialize(new CreateIssueResponse
            {
                Url = issueUrl
            }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }), cancellationToken);
            return okResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating GitHub issue");
            var r = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Internal Server Error", Message = ex.Message }, cancellationToken);
            return r;
        }
    }
}
