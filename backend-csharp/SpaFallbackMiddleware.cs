using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.Functions.Worker.Middleware;
using Microsoft.Extensions.Logging;
using System.Net;

public sealed class SpaFallbackMiddleware : IFunctionsWorkerMiddleware
{
    private const string HttpResponseKey = "HttpResponseData";

    private readonly ILogger<SpaFallbackMiddleware> _logger;

    public SpaFallbackMiddleware(ILogger<SpaFallbackMiddleware> logger)
    {
        _logger = logger;
    }

    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        // Let Functions try to handle the request first
        await next(context);

        // If a response already exists, do nothing
        if (context.Items.ContainsKey(HttpResponseKey))
        {
            return;
        }

        var request = await context.GetHttpRequestDataAsync();
        if (request == null)
        {
            return;
        }

        var path = request.Url.AbsolutePath.Trim('/');

        // Ignore API calls
        if (path.StartsWith("api", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        _logger.LogInformation("SPA fallback triggered for path: {Path}", path);

        var response = request.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "text/html");

        var indexHtml = await File.ReadAllTextAsync("wwwroot/index.html");
        await response.WriteStringAsync(indexHtml);

        context.Items[HttpResponseKey] = response;
    }
}