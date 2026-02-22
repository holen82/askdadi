using System.Text.Json;
using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Functions;

public class IdeaFunction
{
    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILogger<IdeaFunction> _logger;
    private readonly AuthService _authService;
    private readonly IdeaStorageService _ideaStorageService;

    public IdeaFunction(
        ILogger<IdeaFunction> logger,
        AuthService authService,
        IdeaStorageService ideaStorageService)
    {
        _logger = logger;
        _authService = authService;
        _ideaStorageService = ideaStorageService;
    }

    [Function("submitIdea")]
    public async Task<HttpResponseData> Submit(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "ideas")]
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

        SubmitIdeaRequest? request;
        try
        {
            request = await JsonSerializer.DeserializeAsync<SubmitIdeaRequest>(
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

        if (request == null || string.IsNullOrWhiteSpace(request.Text))
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Bad Request", Message = "Text is required" }, cancellationToken);
            return r;
        }

        if (request.Text.Length > 500)
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Bad Request", Message = "Text must be 500 characters or fewer" }, cancellationToken);
            return r;
        }

        try
        {
            var name = _authService.GetUserName(user) ?? email ?? "Unknown";
            var record = await _ideaStorageService.SaveIdeaAsync(request.Text, name, email ?? "unknown", cancellationToken);

            var okResponse = req.CreateResponse(System.Net.HttpStatusCode.Created);
            okResponse.Headers.Add("Content-Type", "application/json");
            await okResponse.WriteStringAsync(JsonSerializer.Serialize(new SubmitIdeaResponse
            {
                Id = record.Id,
                Message = "Idé lagret."
            }, CamelCaseOptions), cancellationToken);
            return okResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving idea");
            var r = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Internal Server Error", Message = ex.Message }, cancellationToken);
            return r;
        }
    }

    [Function("listIdeas")]
    public async Task<HttpResponseData> List(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "ideas")]
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

        try
        {
            var ideas = await _ideaStorageService.ListIdeasAsync(cancellationToken);
            var okResponse = req.CreateResponse(System.Net.HttpStatusCode.OK);
            okResponse.Headers.Add("Content-Type", "application/json");
            await okResponse.WriteStringAsync(JsonSerializer.Serialize(ideas, CamelCaseOptions), cancellationToken);
            return okResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing ideas");
            var r = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Internal Server Error", Message = ex.Message }, cancellationToken);
            return r;
        }
    }

    [Function("deleteIdea")]
    public async Task<HttpResponseData> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "ideas/{id}")]
        HttpRequestData req,
        string id,
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

        try
        {
            var existed = await _ideaStorageService.DeleteIdeaAsync(id, cancellationToken);
            if (!existed)
            {
                var notFound = req.CreateResponse(System.Net.HttpStatusCode.NotFound);
                await notFound.WriteAsJsonAsync(new ErrorResponse { Error = "Not Found", Message = "Idea not found" }, cancellationToken);
                return notFound;
            }

            return req.CreateResponse(System.Net.HttpStatusCode.NoContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting idea {Id}", id);
            var r = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Internal Server Error", Message = ex.Message }, cancellationToken);
            return r;
        }
    }
}
