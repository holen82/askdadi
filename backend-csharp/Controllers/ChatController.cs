using System.Text.Json;
using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Mvc;

namespace DadiChatBot.Controllers;

[ApiController]
[Route("api")]
public class ChatController(
    ILogger<ChatController> logger,
    AuthService authService,
    OpenAIService openAIService,
    UserPreferencesService userPreferencesService) : ControllerBase
{
    [HttpPost("chat")]
    public async Task Post([FromBody] ChatRequest? chatRequest)
    {
        logger.LogInformation("Chat request received");

        var user = authService.ExtractUserFromHeaders(Request);
        if (user == null)
        {
            logger.LogWarning("No user found in request headers");
            Response.StatusCode = 401;
            await Response.WriteAsJsonAsync(new ErrorResponse { Error = "Unauthorized", Message = "User not authenticated" });
            return;
        }

        var email = authService.GetUserEmail(user);
        if (!authService.IsWhitelisted(email))
        {
            logger.LogWarning("User not whitelisted: {Email}", email);
            Response.StatusCode = 403;
            await Response.WriteAsJsonAsync(new ErrorResponse { Error = "Forbidden", Message = "User not authorized to access this application" });
            return;
        }

        string chatMode;
        try { chatMode = (await userPreferencesService.GetPreferencesAsync(user.UserId)).ChatMode; }
        catch (Exception ex) { logger.LogWarning(ex, "Pref fetch failed, defaulting to fun"); chatMode = "fun"; }

        if (chatRequest?.Messages == null || chatRequest.Messages.Length == 0)
        {
            Response.StatusCode = 400;
            await Response.WriteAsJsonAsync(new ErrorResponse { Error = "Bad Request", Message = "Messages array is required and must not be empty" });
            return;
        }

        if (!openAIService.IsConfigured())
        {
            logger.LogError("OpenAI not configured");
            Response.StatusCode = 503;
            await Response.WriteAsJsonAsync(new ErrorResponse { Error = "Service Unavailable", Message = "AI service is not configured" });
            return;
        }

        logger.LogInformation("Processing chat for user {Email} with {MessageCount} messages", email, chatRequest.Messages.Length);

        var acceptHeader = Request.Headers["Accept"].ToString();
        if (acceptHeader.Contains("text/event-stream"))
        {
            await StreamChatResponse(chatRequest.Messages, chatMode);
            return;
        }

        try
        {
            var response = await openAIService.ChatAsync(chatRequest.Messages, chatMode);
            logger.LogInformation("Chat response generated successfully");
            await Response.WriteAsJsonAsync(new ChatResponse { Message = response });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing chat");
            if (ex.Message == "CONTEXT_LENGTH_EXCEEDED")
            {
                Response.StatusCode = 422;
                await Response.WriteAsJsonAsync(new ErrorResponse { Error = "ContextLengthExceeded", Message = "Conversation is too long. Please start a new chat." });
            }
            else
            {
                Response.StatusCode = 500;
                await Response.WriteAsJsonAsync(new ErrorResponse { Error = "Internal Server Error", Message = ex.Message });
            }
        }
    }

    private async Task StreamChatResponse(ChatMessage[] messages, string chatMode)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        try
        {
            await foreach (var chunk in openAIService.ChatStreamAsync(messages, chatMode))
            {
                await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { chunk })}\n\n");
                await Response.Body.FlushAsync();
            }

            await Response.WriteAsync("data: [DONE]\n\n");
            await Response.Body.FlushAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during streaming");
            var isContextLengthError = ex.Message == "CONTEXT_LENGTH_EXCEEDED"
                || ex.Message.Contains("context_length_exceeded", StringComparison.OrdinalIgnoreCase)
                || ex.Message.Contains("maximum context length", StringComparison.OrdinalIgnoreCase);
            var errorPayload = isContextLengthError
                ? new { error = "CONTEXT_LENGTH_EXCEEDED" }
                : new { error = ex.Message };
            await Response.WriteAsync($"data: {JsonSerializer.Serialize(errorPayload)}\n\n");
            await Response.Body.FlushAsync();
        }
    }
}
