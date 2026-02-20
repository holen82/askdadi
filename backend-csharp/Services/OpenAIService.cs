using Azure;
using Azure.AI.OpenAI;
using Azure.Identity;
using DadiChatBot.Models;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;

namespace DadiChatBot.Services;

public class OpenAIService
{
    private readonly ILogger<OpenAIService> _logger;
    private readonly AzureOpenAIClient? _client;
    private readonly string _deployment;

    public OpenAIService(ILogger<OpenAIService> logger)
    {
        _logger = logger;
        
        var endpoint = Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT");
        var apiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_KEY");
        _deployment = Environment.GetEnvironmentVariable("AZURE_OPENAI_DEPLOYMENT") ?? "chat";

        if (string.IsNullOrEmpty(endpoint))
        {
            _logger.LogWarning("OpenAI endpoint not configured. Chat functionality will be limited.");
            return;
        }

        try
        {
            if (!string.IsNullOrEmpty(apiKey))
            {
                _client = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
                _logger.LogInformation("OpenAI client initialized with API key");
            }
            else
            {
                _client = new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential());
                _logger.LogInformation("OpenAI client initialized with DefaultAzureCredential");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize OpenAI client");
            throw;
        }
    }

    public async Task<string> ChatAsync(Models.ChatMessage[] messages)
    {
        if (_client == null)
        {
            throw new InvalidOperationException("OpenAI client not initialized. Check your configuration.");
        }

        try
        {
            var chatClient = _client.GetChatClient(_deployment);
            
            var chatMessages = messages.Select(m => m.Role.ToLowerInvariant() switch
            {
                "system" => (OpenAI.Chat.ChatMessage)new SystemChatMessage(m.Content),
                "assistant" => new AssistantChatMessage(m.Content),
                "user" => new UserChatMessage(m.Content),
                _ => new UserChatMessage(m.Content)
            }).ToList();

            if (!chatMessages.Any(m => m is SystemChatMessage))
            {
                chatMessages.Insert(0, new SystemChatMessage("You are Dadi, a helpful AI assistant. Provide clear, concise, and accurate responses."));
            }

            var options = new ChatCompletionOptions
            {
                Temperature = 0.7f,
                MaxOutputTokenCount = 1000,
                TopP = 0.95f,
                FrequencyPenalty = 0,
                PresencePenalty = 0
            };

            var response = await chatClient.CompleteChatAsync(chatMessages, options);

            if (response?.Value?.Content == null || response.Value.Content.Count == 0)
            {
                throw new InvalidOperationException("No response from OpenAI");
            }

            return response.Value.Content[0].Text ?? "No response generated";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI API error");

            var errorMessage = ex.Message;
            if (errorMessage.Contains("401") || errorMessage.Contains("authentication", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("OpenAI authentication failed. Check your API key.", ex);
            }
            else if (errorMessage.Contains("429"))
            {
                throw new InvalidOperationException("Too many requests. Please try again later.", ex);
            }
            else if (errorMessage.Contains("quota", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("OpenAI quota exceeded. Please contact your administrator.", ex);
            }

            throw new InvalidOperationException("Failed to get response from AI. Please try again.", ex);
        }
    }

    public bool IsConfigured()
    {
        return _client != null;
    }
}
