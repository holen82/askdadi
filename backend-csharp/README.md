# Dadi ChatBot - C# Azure Functions Backend

.NET 8 isolated worker Azure Functions backend for the Dadi AI chatbot.

## Project Structure

```
backend-csharp/
├── Functions/                    # HTTP and timer trigger functions
│   ├── ChatFunction.cs           # POST /chat
│   ├── UserFunction.cs           # GET /user
│   ├── IdeaFunction.cs           # POST/GET /ideas, DELETE /ideas/{id}
│   ├── IssueFunction.cs          # POST /issues
│   ├── UserPreferencesFunction.cs # GET/PUT /userprefs/chatmode
│   └── AutoResolveFunction.cs    # Timer trigger (daily at 02:00 UTC)
├── Models/                       # Data models
├── Services/                     # Business logic services
│   ├── AuthService.cs
│   ├── OpenAIService.cs
│   ├── IdeaStorageService.cs
│   ├── UserPreferencesService.cs
│   ├── GitHubService.cs
│   └── AutoResolveService.cs
└── Utils/                        # Utility functions
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

### POST /ideas
Submit an idea (max 500 characters).

**Request:**
```json
{ "text": "My idea" }
```

**Response (201):**
```json
{ "id": "abc123", "message": "Idé lagret." }
```

### GET /ideas
List all submitted ideas.

**Response:**
```json
[{ "id": "abc123", "text": "My idea", "author": "Name", "authorEmail": "...", "timestamp": "..." }]
```

### DELETE /ideas/{id}
Delete an idea by ID. Returns `204 No Content` on success.

### POST /issues
Create a GitHub issue (max 256 character title). Requires `GITHUB_TOKEN`.

**Request:**
```json
{ "title": "Bug: something is broken" }
```

**Response (201):**
```json
{ "url": "https://github.com/holen82/askdadi/issues/42" }
```

### GET /userprefs/chatmode
Get the current user's chat mode.

**Response:**
```json
{ "chatMode": "normal" }
```

### PUT /userprefs/chatmode
Set the current user's chat mode (`fun` or `normal`).

**Request:**
```json
{ "chatMode": "fun" }
```

**Response:**
```json
{ "chatMode": "fun" }
```

### AutoResolve (Timer)
Runs daily at 02:00 UTC. Fetches open GitHub issues labelled `from-chat`, uses Azure OpenAI to generate a plan and code changes, then commits to a branch and opens a pull request.

## Configuration

Required environment variables (set in Azure Function App Configuration):

- `AzureWebJobsStorage` - Azure Storage connection string (used for ideas and user preferences)
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `AZURE_OPENAI_KEY` - API key (optional, uses DefaultAzureCredential if not set)
- `AZURE_OPENAI_DEPLOYMENT` - Deployment/model name (default: `chat`)
- `WHITELISTED_EMAILS` - Comma-separated list of allowed emails
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated, or `*` for any)
- `GITHUB_TOKEN` - GitHub personal access token with `repo` scope (required for `/issues` and AutoResolve)

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
