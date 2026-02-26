using System.Text.Json;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DadiChatBot.Models;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Services;

public class IdeaStorageService
{
    private readonly ILogger<IdeaStorageService> _logger;
    private readonly BlobContainerClient _containerClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public IdeaStorageService(ILogger<IdeaStorageService> logger)
    {
        _logger = logger;

        var connectionString = Environment.GetEnvironmentVariable("AzureWebJobsStorage")
            ?? throw new InvalidOperationException("AzureWebJobsStorage environment variable is not set.");

        var serviceClient = new BlobServiceClient(connectionString);
        _containerClient = serviceClient.GetBlobContainerClient("ideas");
        _containerClient.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<IdeaRecord> SaveIdeaAsync(
        string text,
        string author,
        string authorEmail,
        CancellationToken cancellationToken = default)
    {
        var record = new IdeaRecord
        {
            Id = Guid.NewGuid().ToString("N"),
            Text = text,
            Author = author,
            AuthorEmail = authorEmail,
            Timestamp = DateTimeOffset.UtcNow
        };

        var json = JsonSerializer.Serialize(record, JsonOptions);
        var blobClient = _containerClient.GetBlobClient($"{record.Id}.json");

        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(json));
        await blobClient.UploadAsync(stream, overwrite: false, cancellationToken);

        _logger.LogInformation("Saved idea {Id} for {Email}", record.Id, authorEmail);
        return record;
    }

    public async Task<IdeaRecord[]> ListIdeasAsync(CancellationToken cancellationToken = default)
    {
        var ideas = new List<IdeaRecord>();

        await foreach (var blobItem in _containerClient.GetBlobsAsync(cancellationToken: cancellationToken))
        {
            if (!blobItem.Name.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                continue;

            try
            {
                var blobClient = _containerClient.GetBlobClient(blobItem.Name);
                var download = await blobClient.DownloadContentAsync(cancellationToken);
                var record = JsonSerializer.Deserialize<IdeaRecord>(download.Value.Content, JsonOptions);
                if (record != null)
                    ideas.Add(record);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to read blob {BlobName}", blobItem.Name);
            }
        }

        return ideas.OrderBy(r => r.Timestamp).ToArray();
    }

    public async Task<bool> DeleteIdeaAsync(string id, CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient($"{id}.json");
        var response = await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        _logger.LogInformation("Delete idea {Id}: existed={Existed}", id, response.Value);
        return response.Value;
    }
}
