using System.Text.Json;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DadiChatBot.Models;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Services;

public class UserPreferencesService
{
    private readonly ILogger<UserPreferencesService> _logger;
    private readonly BlobContainerClient _containerClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public UserPreferencesService(ILogger<UserPreferencesService> logger)
    {
        _logger = logger;

        var connectionString = Environment.GetEnvironmentVariable("AzureWebJobsStorage")
            ?? throw new InvalidOperationException("AzureWebJobsStorage environment variable is not set.");

        var serviceClient = new BlobServiceClient(connectionString);
        _containerClient = serviceClient.GetBlobContainerClient("userprefs");
        _containerClient.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<UserPreferences> GetPreferencesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient($"{userId}.json");
        try
        {
            var download = await blobClient.DownloadContentAsync(cancellationToken);
            var prefs = JsonSerializer.Deserialize<UserPreferences>(download.Value.Content, JsonOptions);
            return prefs ?? new UserPreferences();
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return new UserPreferences();
        }
    }

    public async Task<UserPreferences> SetChatModeAsync(string userId, string mode, CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient($"{userId}.json");

        UserPreferences prefs;
        try
        {
            var download = await blobClient.DownloadContentAsync(cancellationToken);
            prefs = JsonSerializer.Deserialize<UserPreferences>(download.Value.Content, JsonOptions) ?? new UserPreferences();
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            prefs = new UserPreferences();
        }

        prefs.ChatMode = mode;

        var json = JsonSerializer.Serialize(prefs, JsonOptions);
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(json));
        await blobClient.UploadAsync(stream, overwrite: true, cancellationToken);

        _logger.LogInformation("Set chat mode for user {UserId} to {Mode}", userId, mode);
        return prefs;
    }
}
