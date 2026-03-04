using DadiChatBot.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddApplicationInsightsTelemetry();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Bridge appsettings values → environment variables so services can use
// Environment.GetEnvironmentVariable() the same way as on Azure App Service
foreach (var key in new[]
{
    "AZURE_STORAGE_CONNECTION_STRING", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_KEY",
    "AZURE_OPENAI_DEPLOYMENT", "WHITELISTED_EMAILS", "GITHUB_TOKEN", "BYPASS_AUTH_FOR_LOCAL_DEV"
})
{
    if (Environment.GetEnvironmentVariable(key) is null && builder.Configuration[key] is { } val)
        Environment.SetEnvironmentVariable(key, val);
}

builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<OpenAIService>();
builder.Services.AddSingleton<IdeaStorageService>();
builder.Services.AddSingleton<UserPreferencesService>();
builder.Services.AddSingleton<GitHubService>();
builder.Services.AddSingleton<AutoResolveService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors();
app.MapControllers();
app.MapFallbackToFile("index.html");

await app.RunAsync();
