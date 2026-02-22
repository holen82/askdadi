using System.Text;
using System.Text.Json;
using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Functions;

public class ChatFunction
{
    private readonly ILogger<ChatFunction> _logger;
    private readonly AuthService _authService;
    private readonly OpenAIService _openAIService;

    public ChatFunction(
        ILogger<ChatFunction> logger, 
        AuthService authService,
        OpenAIService openAIService)
    {
        _logger = logger;
        _authService = authService;
        _openAIService = openAIService;
    }

    [Function("chat")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "chat")] HttpRequestData req)
    {
        _logger.LogInformation("Chat request received");

        var user = _authService.ExtractUserFromHeaders(req);
        
        if (user == null)
        {
            _logger.LogWarning("No user found in request headers");
            var unauthorizedResponse = req.CreateResponse(System.Net.HttpStatusCode.Unauthorized);
            await unauthorizedResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Unauthorized",
                Message = "User not authenticated"
            });
            return unauthorizedResponse;
        }

        var email = _authService.GetUserEmail(user);
        
        if (!_authService.IsWhitelisted(email))
        {
            _logger.LogWarning("User not whitelisted: {Email}", email);
            var forbiddenResponse = req.CreateResponse(System.Net.HttpStatusCode.Forbidden);
            await forbiddenResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Forbidden",
                Message = "User not authorized to access this application"
            });
            return forbiddenResponse;
        }

        ChatRequest? chatRequest;
        try
        {
            chatRequest = await JsonSerializer.DeserializeAsync<ChatRequest>(
                req.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Invalid request body");
            var badRequestResponse = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await badRequestResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Bad Request",
                Message = "Invalid request body"
            });
            return badRequestResponse;
        }

        if (chatRequest?.Messages == null || chatRequest.Messages.Length == 0)
        {
            var badRequestResponse = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
            await badRequestResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Bad Request",
                Message = "Messages array is required and must not be empty"
            });
            return badRequestResponse;
        }

        if (!_openAIService.IsConfigured())
        {
            _logger.LogError("OpenAI not configured");
            var unavailableResponse = req.CreateResponse(System.Net.HttpStatusCode.ServiceUnavailable);
            await unavailableResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Service Unavailable",
                Message = "AI service is not configured"
            });
            return unavailableResponse;
        }

        try
        {
            _logger.LogInformation("Processing chat for user {Email} with {MessageCount} messages", 
                email, chatRequest.Messages.Length);

            var acceptHeader = req.Headers.GetValues("Accept").FirstOrDefault() ?? "";
            if (acceptHeader.Contains("text/event-stream"))
            {
                return await StreamChatResponse(req, chatRequest.Messages);
            }

            var response = await _openAIService.ChatAsync(chatRequest.Messages);

            _logger.LogInformation("Chat response generated successfully");

            var okResponse = req.CreateResponse(System.Net.HttpStatusCode.OK);
            await okResponse.WriteAsJsonAsync(new ChatResponse
            {
                Message = response
            });
            return okResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat");

            if (ex.Message == "CONTEXT_LENGTH_EXCEEDED")
            {
                var r = req.CreateResponse(System.Net.HttpStatusCode.UnprocessableEntity);
                await r.WriteAsJsonAsync(new ErrorResponse
                {
                    Error = "ContextLengthExceeded",
                    Message = "Conversation is too long. Please start a new chat."
                });
                return r;
            }

            var errorResponse = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Internal Server Error",
                Message = ex.Message
            });
            return errorResponse;
        }
    }

    private async Task<HttpResponseData> StreamChatResponse(HttpRequestData req, Models.ChatMessage[] messages)
    {
        var response = req.CreateResponse();
        response.StatusCode = System.Net.HttpStatusCode.OK;
        response.Headers.Add("Content-Type", "text/event-stream");
        response.Headers.Add("Cache-Control", "no-cache");
        response.Headers.Add("Connection", "keep-alive");

        try
        {
            var bodyStream = response.Body;
            var writer = new StreamWriter(bodyStream, Encoding.UTF8, leaveOpen: false);

            await foreach (var chunk in _openAIService.ChatStreamAsync(messages))
            {
                var sseData = $"data: {JsonSerializer.Serialize(new { chunk })}\n\n";
                await writer.WriteAsync(sseData);
                await writer.FlushAsync();
                await bodyStream.FlushAsync();
            }

            await writer.WriteAsync("data: [DONE]\n\n");
            await writer.FlushAsync();
            await bodyStream.FlushAsync();
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during streaming");
            var errorPayload = ex.Message == "CONTEXT_LENGTH_EXCEEDED"
                ? new { error = "CONTEXT_LENGTH_EXCEEDED" }
                : new { error = ex.Message };
            var errorData = $"data: {JsonSerializer.Serialize(errorPayload)}\n\n";
            await response.Body.WriteAsync(Encoding.UTF8.GetBytes(errorData));
            await response.Body.FlushAsync();
            return response;
        }
    }
}
