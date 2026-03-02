using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

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
    public IActionResult Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "{*path}")] HttpRequest req)
    {
        var wwwroot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "wwwroot"));
        var requestPath = req.RouteValues["path"]?.ToString() ?? string.Empty;

        if (!string.IsNullOrEmpty(requestPath))
        {
            var filePath = Path.GetFullPath(Path.Combine(wwwroot, requestPath));

            // Security: reject path traversal attempts
            if (filePath.StartsWith(wwwroot, StringComparison.OrdinalIgnoreCase) && File.Exists(filePath))
            {
                var ext = Path.GetExtension(filePath);
                var contentType = MimeTypes.TryGetValue(ext, out var mime) ? mime : "application/octet-stream";
                return new PhysicalFileResult(filePath, contentType);
            }
        }

        // SPA fallback: return index.html for all unmatched routes
        return new PhysicalFileResult(Path.Combine(wwwroot, "index.html"), "text/html");
    }
}
