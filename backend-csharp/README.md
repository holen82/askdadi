# Dadi ChatBot - C# Azure Functions Backend

.NET 8 isolated worker Azure Functions backend for the Dadi AI chatbot.

## Project Structure

```
backend-csharp/
├── Functions/          # HTTP trigger functions
│   ├── ChatFunction.cs
│   └── UserFunction.cs
├── Models/             # Data models
├── Services/           # Business logic services
│   ├── AuthService.cs
│   └── OpenAIService.cs
└── Utils/              # Utility functions
```

## Endpoints

### GET /user
Returns authenticated user information.

**Response:**
```json
{
  "email": "user@example.com",
  "provider": "google",
  "userId": "12345",
  "isAuthenticated": true
}
```

### POST /chat
Send chat messages to AI assistant.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

**Response:**
```json
{
  "message": "Hi! How can I help you today?"
}
```

## Configuration

Required environment variables (set in Azure Function App Configuration):

- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `AZURE_OPENAI_KEY` - API key (optional, uses DefaultAzureCredential if not set)
- `AZURE_OPENAI_DEPLOYMENT` - Deployment/model name (default: "chat")
- `WHITELISTED_EMAILS` - Comma-separated list of allowed emails
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated, or "*" for any)

## Local Development

1. Copy `local.settings.json.template` to `local.settings.json`
2. Fill in your configuration values
3. Run: `func start` or `dotnet run`

## Build & Deploy

```bash
# Build
dotnet build

# Publish
dotnet publish -c Release

# Deploy (via Azure CLI)
func azure functionapp publish <function-app-name>
```

## Troubleshooting

### Backend fails to start locally

If you get "Cannot access a disposed object" error:
1. Ensure you're using the correct Program.cs pattern (see [docs/troubleshooting.md](../docs/troubleshooting.md))
2. Check `local.settings.json` is valid JSON without invalid `Host` section

### Other Issues

See [docs/troubleshooting.md](../docs/troubleshooting.md) for common issues and solutions.

## Authentication

Uses Azure Easy Auth (App Service Authentication). The function expects:
- `x-ms-client-principal` header (injected by Easy Auth)
- Email whitelist validation on all endpoints
- Google OAuth configured in Azure Portal
