# Dadi ChatBot - C# ASP.NET Core Backend

.NET 10 ASP.NET Core web application backend for the Dadi AI chatbot. Serves both the API and the frontend SPA.

## Project Structure

```
backend-csharp/
├── Controllers/                  # HTTP controllers
│   ├── ChatController.cs         # POST /api/chat
│   ├── UserController.cs         # GET /api/user
│   ├── IdeasController.cs        # POST/GET /api/ideas, DELETE /api/ideas/{id}
│   ├── IssuesController.cs       # POST /api/issues
│   └── UserPreferencesController.cs # GET/PUT /api/userprefs/chatmode
├── Models/                       # Data models
├── Services/                     # Business logic services
│   ├── AuthService.cs
│   ├── OpenAIService.cs
│   ├── IdeaStorageService.cs
│   ├── UserPreferencesService.cs
│   ├── GitHubService.cs
│   └── AutoResolveService.cs
├── wwwroot/                      # Built frontend assets (populated by CI)
├── Program.cs                    # App startup
└── appsettings.json              # Configuration
```

## Endpoints

### GET /api/user
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

### POST /api/chat
Send chat messages to AI assistant. Supports both JSON and SSE streaming (`Accept: text/event-stream`).

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

### POST /api/ideas
Submit an idea (max 500 characters).

**Request:**
```json
{ "text": "My idea" }
```

**Response (201):**
```json
{ "id": "abc123", "message": "Idé lagret." }
```

### GET /api/ideas
List all submitted ideas.

**Response:**
```json
[{ "id": "abc123", "text": "My idea", "author": "Name", "authorEmail": "...", "timestamp": "..." }]
```

### DELETE /api/ideas/{id}
Delete an idea by ID. Returns `204 No Content` on success.

### POST /api/issues
Create a GitHub issue (max 256 character title). Requires `GITHUB_TOKEN`.

**Request:**
```json
{ "title": "Bug: something is broken" }
```

**Response (201):**
```json
{ "url": "https://github.com/holen82/askdadi/issues/42" }
```

### GET /api/userprefs/chatmode
Get the current user's chat mode.

**Response:**
```json
{ "chatMode": "normal" }
```

### PUT /api/userprefs/chatmode
Set the current user's chat mode (`fun` or `normal`).

**Request:**
```json
{ "chatMode": "fun" }
```

**Response:**
```json
{ "chatMode": "fun" }
```

## Configuration

Required environment variables (set in Azure App Service → Configuration → Application settings):

- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection string (used for ideas and user preferences)
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `AZURE_OPENAI_KEY` - API key (optional if using managed identity)
- `AZURE_OPENAI_DEPLOYMENT` - Deployment/model name (default: `chat`)
- `WHITELISTED_EMAILS` - Comma-separated list of allowed emails
- `GITHUB_TOKEN` - GitHub personal access token with `repo` scope (required for `/api/issues` and AutoResolve)

## Local Development

1. Edit `appsettings.Development.json` with your local config values
2. Run: `dotnet run`
3. Set `VITE_FUNCTION_APP_URL=http://localhost:5000` (or whichever port is used) in `frontend/.env.development`

## Build & Deploy

```bash
# Build
dotnet build

# Publish
dotnet publish -c Release --output ./output
```

Deployment is handled automatically by the GitHub Actions workflow (`.github/workflows/backend-deploy.yml`), which:
1. Builds the frontend and copies the output to `wwwroot/`
2. Publishes the .NET project
3. Deploys to Azure App Service (`app-dadi`)

## Authentication

Uses Azure Easy Auth (App Service Authentication). The app expects:
- `x-ms-client-principal` header (injected by Easy Auth)
- Email whitelist validation on all endpoints
- Google OAuth configured in Azure Portal
- Easy Auth set to **"Allow unauthenticated requests"** so static assets are accessible before login
