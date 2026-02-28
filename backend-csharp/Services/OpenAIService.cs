using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OpenAI;
using OpenAI.Chat;
using System.ClientModel;

#pragma warning disable OPENAI001

namespace DadiChatBot.Services;

public class OpenAIService
{
    private readonly ILogger<OpenAIService> _logger;
    private readonly ChatClient? _client;

    public OpenAIService(ILogger<OpenAIService> logger)
    {
        _logger = logger;

        var endpoint = Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT");
        var apiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_KEY");
        var deploymentName = Environment.GetEnvironmentVariable("AZURE_OPENAI_DEPLOYMENT") ?? "gpt-5.2-chat";

        logger.LogInformation("Initializing OpenAI client with endpoint: {Endpoint} and deployment: {Deployment}", endpoint, deploymentName);

        if (string.IsNullOrEmpty(endpoint))
        {
            _logger.LogWarning("OpenAI endpoint not configured. Chat functionality will be limited.");
            return;
        }

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("OpenAI API key not configured. Chat functionality will be limited.");
            return;
        }

        try
        {
            _client = new ChatClient(
                credential: new ApiKeyCredential(apiKey),
                model: deploymentName,
                options: new OpenAIClientOptions()
                {
                    Endpoint = new Uri(endpoint)
                });

            _logger.LogInformation("ChatClient initialized for deployment: {Deployment}", deploymentName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize ChatClient");
            throw;
        }
    }

    private static string GetSystemPrompt(string chatMode) => chatMode switch
    {
        "normal" => "Du er Dad-I, en hjelpsom AI-assistent. Gi klare, presise og nyttige svar på norsk. Hold svar korte med mindre du blir spurt om noe annet.",
        _ => "Du er Dad-I, en AI-assistent for unge voksne i Norge. Svar på en vennlig, uformell og engasjerende måte – bruk gjerne norsk ungdomsspråk og slang der det faller naturlig. Vær hjelpsom, tydelig og hold deg til poenget, men ha det litt gøy med en og annen tørr pappavits (aldri fortell at du har en pappavits, disse må snikes inn)!"
    };

    public async Task<string> ChatAsync(Models.ChatMessage[] messages, string chatMode = "fun")
    {
        if (_client == null)
        {
            throw new InvalidOperationException("ChatClient not initialized. Check your configuration.");
        }

        try
        {
            var chatMessages = messages.Select(m => m.Role.ToLowerInvariant() switch
            {
                "system" => (OpenAI.Chat.ChatMessage)new SystemChatMessage(m.Content),
                "assistant" => new AssistantChatMessage(m.Content),
                "user" => new UserChatMessage(m.Content),
                _ => new UserChatMessage(m.Content)
            }).ToList();

            if (!chatMessages.Any(m => m is SystemChatMessage))
            {
                chatMessages.Insert(0, new SystemChatMessage(GetSystemPrompt(chatMode)));
            }

            var options = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 1000,
                FrequencyPenalty = 0,
                PresencePenalty = 0
            };

            var completion = await _client.CompleteChatAsync(chatMessages, options);

            if (completion?.Value?.Content == null || completion.Value.Content.Count == 0)
            {
                throw new InvalidOperationException("No response from OpenAI");
            }

            return completion.Value.Content[0].Text ?? "No response generated";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI API error");

            if (IsContextLengthError(ex))
                throw new InvalidOperationException("CONTEXT_LENGTH_EXCEEDED", ex);

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

    private static bool IsContextLengthError(Exception ex)
    {
        var msg = ex.Message ?? string.Empty;
        return msg.Contains("context_length_exceeded", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("maximum context length", StringComparison.OrdinalIgnoreCase);
    }

    public async IAsyncEnumerable<string> ChatStreamAsync(Models.ChatMessage[] messages, string chatMode = "fun")
    {
        if (_client == null)
        {
            throw new InvalidOperationException("ChatClient not initialized. Check your configuration.");
        }

        var chatMessages = messages.Select(m => m.Role.ToLowerInvariant() switch
        {
            "system" => (OpenAI.Chat.ChatMessage)new SystemChatMessage(m.Content),
            "assistant" => new AssistantChatMessage(m.Content),
            "user" => new UserChatMessage(m.Content),
            _ => new UserChatMessage(m.Content)
        }).ToList();

        if (!chatMessages.Any(m => m is SystemChatMessage))
        {
            chatMessages.Insert(0, new SystemChatMessage(GetSystemPrompt(chatMode)));
        }

        var options = new ChatCompletionOptions
        {
            MaxOutputTokenCount = 1000,
            FrequencyPenalty = 0,
            PresencePenalty = 0
        };

        var streamingUpdates = _client.CompleteChatStreamingAsync(chatMessages, options);

        await foreach (var update in streamingUpdates)
        {
            foreach (var contentPart in update.ContentUpdate)
            {
                if (!string.IsNullOrEmpty(contentPart.Text))
                {
                    yield return contentPart.Text;
                }
            }
        }
    }

    public bool IsConfigured()
    {
        return _client != null;
    }

    private const string PlanSystemPrompt =
        "You are a senior software architect reviewing a full-stack application: " +
        "a C# Azure Functions (.NET 8 isolated worker) backend and a vanilla TypeScript frontend (Vite). " +
        "Create a precise, actionable, step-by-step implementation plan for the given GitHub issue. " +
        "Name exact files, classes, methods, and signatures for both backend and frontend as applicable. " +
        "List NuGet packages and config changes needed. " +
        "Under 1500 words, Markdown numbered steps. No actual code — that comes in a separate step.";

    private const string CodeGenSystemPrompt =
        "You are a senior software engineer implementing changes in a full-stack application: " +
        "a C# Azure Functions (.NET 8 isolated worker) backend and a vanilla TypeScript frontend (Vite). " +
        "Given an implementation plan and the existing source files, produce the complete updated file contents. " +
        "Return ONLY a valid JSON object with this exact structure:\n" +
        "{\"summary\": \"Short description\", \"fileChanges\": {\"path/to/file\": \"complete file content\"}}\n" +
        "Include only files that need to be created or modified. Paths must be relative to the repository root. " +
        "Do not include markdown code fences or any text outside the JSON object.\n" +
        "CRITICAL: Every file in fileChanges MUST contain the ENTIRE file content — every single line, from the first to the last. " +
        "NEVER truncate, abbreviate, or omit any part of a file. " +
        "NEVER use placeholder comments such as '// rest of file unchanged', '// existing code here', " +
        "'// ... (rest stays the same)', '/* unchanged */', or any similar shorthand. " +
        "The content you return will be written directly to disk as-is, so a truncated file will break the application. " +
        "If a file is large, you must still output every line in full.";

    private static string BuildSourceContext(string issueTitle, string issueBody, List<Models.SourceFile> sourceFiles)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"## Issue: {issueTitle}");
        sb.AppendLine();
        if (!string.IsNullOrEmpty(issueBody))
        {
            sb.AppendLine(issueBody);
            sb.AppendLine();
        }
        sb.AppendLine("## Source Files");
        foreach (var file in sourceFiles)
        {
            sb.AppendLine($"### {file.Path}");
            sb.AppendLine("```");
            sb.AppendLine(file.Content);
            sb.AppendLine("```");
            sb.AppendLine();
        }
        return sb.ToString();
    }

    public async Task<string> GenerateImplementationPlanAsync(
        string issueTitle,
        string issueBody,
        List<Models.SourceFile> sourceFiles,
        CancellationToken ct = default)
    {
        if (_client == null)
            throw new InvalidOperationException("ChatClient not initialized. Check your configuration.");

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(PlanSystemPrompt),
            new UserChatMessage(BuildSourceContext(issueTitle, issueBody, sourceFiles))
        };

        var options = new ChatCompletionOptions
        {
            MaxOutputTokenCount = 4000,
        };

        try
        {
            var completion = await _client.CompleteChatAsync(messages, options, ct);
            return completion.Value.Content[0].Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI error during plan generation for issue: {Title}", issueTitle);
            if (IsContextLengthError(ex))
                throw new InvalidOperationException("CONTEXT_LENGTH_EXCEEDED", ex);
            throw;
        }
    }

    public async Task<Models.AiCodeChangesResponse> GenerateCodeChangesAsync(
        string issueTitle,
        string issueBody,
        string plan,
        List<Models.SourceFile> sourceFiles,
        CancellationToken ct = default)
    {
        if (_client == null)
            throw new InvalidOperationException("ChatClient not initialized. Check your configuration.");

        var userContent = new StringBuilder(BuildSourceContext(issueTitle, issueBody, sourceFiles));
        userContent.AppendLine("## Implementation Plan");
        userContent.AppendLine(plan);

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(CodeGenSystemPrompt),
            new UserChatMessage(userContent.ToString())
        };

        var options = new ChatCompletionOptions
        {
            MaxOutputTokenCount = 8000,
        };

        try
        {
            var completion = await _client.CompleteChatAsync(messages, options, ct);
            var json = completion.Value.Content[0].Text ?? "{}";
            return JsonSerializer.Deserialize<Models.AiCodeChangesResponse>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? new Models.AiCodeChangesResponse();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI error during code generation for issue: {Title}", issueTitle);
            if (IsContextLengthError(ex))
                throw new InvalidOperationException("CONTEXT_LENGTH_EXCEEDED", ex);
            throw;
        }
    }
}
