using DadiChatBot.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Functions;

public class AutoResolveFunction
{
    private readonly AutoResolveService _autoResolveService;
    private readonly ILogger<AutoResolveFunction> _logger;

    public AutoResolveFunction(AutoResolveService autoResolveService, ILogger<AutoResolveFunction> logger)
    {
        _autoResolveService = autoResolveService;
        _logger = logger;
    }

    [Function("AutoResolve")]
    public async Task RunAsync([TimerTrigger("0 0 2 * * *")] TimerInfo timerInfo) //Update schedule to "0 * * * * *" to test locally, will run each minute
    {
        _logger.LogInformation("AutoResolve function started at {Time}", DateTime.UtcNow);

        try
        {
            var count = await _autoResolveService.RunAutoResolveAsync();
            _logger.LogInformation("AutoResolve completed. Processed {Count} issue(s).", count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AutoResolve function encountered a fatal error.");
        }
    }
}
