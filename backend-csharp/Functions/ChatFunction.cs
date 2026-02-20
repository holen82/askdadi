using System.Text.Json;
using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
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
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "chat")] HttpRequest req)
    {
        _logger.LogInformation("Chat request received");

        var user = _authService.ExtractUserFromHeaders(req);
        
        if (user == null)
        {
            _logger.LogWarning("No user found in request headers");
            return new UnauthorizedObjectResult(new ErrorResponse
            {
                Error = "Unauthorized",
                Message = "User not authenticated"
            });
        }

        var email = _authService.GetUserEmail(user);
        
        if (!_authService.IsWhitelisted(email))
        {
            _logger.LogWarning("User not whitelisted: {Email}", email);
            return new ObjectResult(new ErrorResponse
            {
                Error = "Forbidden",
                Message = "User not authorized to access this application"
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
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
            return new BadRequestObjectResult(new ErrorResponse
            {
                Error = "Bad Request",
                Message = "Invalid request body"
            });
        }

        if (chatRequest?.Messages == null || chatRequest.Messages.Length == 0)
        {
            return new BadRequestObjectResult(new ErrorResponse
            {
                Error = "Bad Request",
                Message = "Messages array is required and must not be empty"
            });
        }

        if (!_openAIService.IsConfigured())
        {
            _logger.LogError("OpenAI not configured");
            return new ObjectResult(new ErrorResponse
            {
                Error = "Service Unavailable",
                Message = "AI service is not configured"
            })
            {
                StatusCode = StatusCodes.Status503ServiceUnavailable
            };
        }

        try
        {
            _logger.LogInformation("Processing chat for user {Email} with {MessageCount} messages", 
                email, chatRequest.Messages.Length);

            var response = await _openAIService.ChatAsync(chatRequest.Messages);

            _logger.LogInformation("Chat response generated successfully");

            return new OkObjectResult(new ChatResponse
            {
                Message = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat");

            return new ObjectResult(new ErrorResponse
            {
                Error = "Internal Server Error",
                Message = ex.Message
            })
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };
        }
    }
}
