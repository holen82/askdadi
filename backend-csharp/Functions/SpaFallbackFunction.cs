using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace DadiChatBot.Functions;

public class SpaFallbackFunction
{
    private static readonly Dictionary<string, string> MimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".js",          "application/javascript" },
        { ".css",         "text/css" },
        { ".html",        "text/html" },
        { ".json",        "application/json" },
        { ".svg",         "image/svg+xml" },
        { ".png",         "image/png" },
        { ".jpg",         "image/jpeg" },
        { ".ico",         "image/x-icon" },
        { ".woff2",       "font/woff2" },
        { ".woff",        "font/woff" },
        { ".txt",         "text/plain" },
        { ".webmanifest", "application/manifest+json" },
    };

    [Function("SpaFallback")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "{*path}")] HttpRequestData req)
    {
        var wwwroot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "wwwroot"));
        var requestPath = req.Url.AbsolutePath.TrimStart('/');

        string filePath = Path.Combine(wwwroot, "index.html");
        string contentType = "text/html";

        if (!string.IsNullOrEmpty(requestPath))
        {
            var candidate = Path.GetFullPath(Path.Combine(wwwroot, requestPath));
            if (candidate.StartsWith(wwwroot, StringComparison.OrdinalIgnoreCase) && File.Exists(candidate))
            {
                filePath = candidate;
                var ext = Path.GetExtension(filePath);
                contentType = MimeTypes.TryGetValue(ext, out var mime) ? mime : "application/octet-stream";
            }
        }

        var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
        response.Headers.Add("Content-Type", contentType);
        await response.Body.WriteAsync(await File.ReadAllBytesAsync(filePath));
        return response;
    }
}
