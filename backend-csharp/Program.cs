using DadiChatBot.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices((context, services) =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();

        // Register application services
        services.AddSingleton<AuthService>();
        services.AddSingleton<OpenAIService>();
        services.AddSingleton<IdeaStorageService>();
        services.AddSingleton<UserPreferencesService>();
        services.AddSingleton<GitHubService>();
    })
    .Build();

await host.RunAsync();
