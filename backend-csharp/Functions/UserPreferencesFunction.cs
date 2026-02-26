using System.Text.Json;
using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Functions;

public class UserPreferencesFunction
{
    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILogger<UserPreferencesFunction> _logger;
    private readonly AuthService _authService;
    private readonly UserPreferencesService _userPreferencesService;

    public UserPreferencesFunction(
        ILogger<UserPreferencesFunction> logger,
        AuthService authService,
        UserPreferencesService userPreferencesService)
    {
        _logger = logger;
        _authService = authService;
        _userPreferencesService = userPreferencesService;
    }

    [Function("getChatMode")]
    public async Task<HttpResponseData> GetChatMode(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "userprefs/chatmode")]
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
            var prefs = await _userPreferencesService.GetPreferencesAsync(user.UserId, cancellationToken);
            var okResponse = req.CreateResponse(System.Net.HttpStatusCode.OK);
            okResponse.Headers.Add("Content-Type", "application/json");
            await okResponse.WriteStringAsync(
                JsonSerializer.Serialize(new ChatModeResponse { ChatMode = prefs.ChatMode }, CamelCaseOptions),
                cancellationToken);
            return okResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat mode for user {UserId}", user.UserId);
            var r = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Internal Server Error", Message = ex.Message }, cancellationToken);
            return r;
        }
    }

    [Function("setChatMode")]
    public async Task<HttpResponseData> SetChatMode(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "userprefs/chatmode")]
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

        SetChatModeRequest? request;
        try
        {
            request = await JsonSerializer.DeserializeAsync<SetChatModeRequest>(
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

        if (request == null || (request.ChatMode != "fun" && request.ChatMode != "normal"))
        {
            var r = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Bad Request", Message = "chatMode must be 'fun' or 'normal'" }, cancellationToken);
            return r;
        }

        try
        {
            var prefs = await _userPreferencesService.SetChatModeAsync(user.UserId, request.ChatMode, cancellationToken);
            var okResponse = req.CreateResponse(System.Net.HttpStatusCode.OK);
            okResponse.Headers.Add("Content-Type", "application/json");
            await okResponse.WriteStringAsync(
                JsonSerializer.Serialize(new ChatModeResponse { ChatMode = prefs.ChatMode }, CamelCaseOptions),
                cancellationToken);
            return okResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting chat mode for user {UserId}", user.UserId);
            var r = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await r.WriteAsJsonAsync(new ErrorResponse { Error = "Internal Server Error", Message = ex.Message }, cancellationToken);
            return r;
        }
    }
}
