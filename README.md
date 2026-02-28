# Dadi - AI Assistant Chatbot

A secure, Azure-hosted AI chatbot application with Google OAuth authentication and whitelist-based access control.

## Features

- **Google OAuth Authentication** - Secure login via Azure Easy Auth
- **Whitelist-based Access** - Control who can use the application
- **Azure OpenAI Integration** - Powered by GPT models
- **Chat Modes** - Switch between `fun` and `normal` personality modes (per-user, persisted)
- **Conversation History** - Browse, pin, and delete past conversations (stored in-browser)
- **Slash Commands** - Built-in tool framework with `/idea`, `/ideas`, `/issue`, `/chatmode`
- **Idea Bank** - Submit and list ideas stored in Azure Blob Storage
- **GitHub Issue Creation** - Create GitHub issues directly from chat with `/issue`
- **AI Auto-Resolve** - Nightly timer that automatically resolves GitHub issues by generating code and opening PRs
- **Mobile-Responsive UI** - Carousel-style panel navigation on mobile devices
- **PWA Support** - Installable as a Progressive Web App via service worker
- **Modern Chat Interface** - Clean, responsive UI with markdown rendering and syntax highlighting
- **Fully Cloud-hosted** - Azure Storage + C# Function App
- **Auto-deployment** - GitHub Actions CI/CD pipeline

## Architecture

- **Frontend**: TypeScript + Vite + Vanilla TS → Azure Storage Static Website
- **Backend**: C# Azure Functions (.NET 8 isolated worker) → Azure Function App
- **Storage**: Azure Blob Storage (ideas, user preferences)
- **AI**: Azure OpenAI Service
- **Auth**: Azure Easy Auth on Function App (Google)
- **GitHub Integration**: GitHub API (issue creation, auto-resolve PRs)
- **Deployment**: Separate GitHub Actions workflows

## Quick Start

### Prerequisites

- Azure subscription with:
  - Azure Storage account (with static website hosting enabled)
  - Azure Function App (.NET 8 isolated worker)
  - Azure OpenAI resource with deployed model
  - Easy Auth configured on Function App (Google OAuth)
- GitHub repository with required secrets configured

### Setup

1. **Configure Azure Resources**
   - Follow [docs/azure-setup.md](docs/azure-setup.md) to create required resources
   - Follow [docs/azure-storage-setup.md](docs/azure-storage-setup.md) for frontend hosting
   - Follow [docs/function-app-setup.md](docs/function-app-setup.md) for backend

2. **Configure Function App**
   - Set environment variables in Azure Function App Configuration:
     - `AZURE_OPENAI_ENDPOINT`
     - `AZURE_OPENAI_KEY`
     - `AZURE_OPENAI_DEPLOYMENT`
     - `WHITELISTED_EMAILS`
     - `ALLOWED_ORIGINS` (include Storage static website URL)
     - `AzureWebJobsStorage` (Azure Storage connection string for ideas/preferences)
     - `GITHUB_TOKEN` (GitHub personal access token for issue creation and auto-resolve)

3. **Configure Easy Auth**
   - Enable Authentication on Function App
   - Add Google identity provider
   - Configure redirect URLs

4. **Deploy**
   - Push to `master` branch to trigger automatic deployment via GitHub Actions
   - Backend: Deploys to Azure Function App
   - Frontend: Deploys to Azure Storage `$web` container

5. **Access**
   - Navigate to your Azure Storage static website URL
   - Login with Google using a whitelisted email
   - Start chatting with Dadi!

## Documentation

- [Azure Setup Guide](docs/azure-setup.md) - Create Azure resources
- [Azure Storage Setup](docs/azure-storage-setup.md) - Configure static website hosting
- [Function App Setup](docs/function-app-setup.md) - Configure C# Function App
- [Configuration Guide](docs/configuration.md) - Configure the application
- [GitHub Secrets Setup](docs/github-secrets.md) - Configure GitHub Actions

## Project Structure

```
dadi/
├── frontend/              # Frontend application (Vanilla TS)
│   ├── src/
│   │   ├── components/    # UI components (Header, Chat, Message, ConversationSidebar, InfoPanel, ConfirmDialog, LoginScreen)
│   │   ├── services/      # API services (chat, user, auth, chatmode, idea, conversationStorage, conversationStore)
│   │   ├── styles/        # CSS stylesheets
│   │   ├── tools/         # Slash command tools (idea, issue, chatmode, toolRegistry)
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions (authGuard, deviceMode, debugMode, errors, tokenUtils)
│   └── public/            # Static assets
├── backend-csharp/        # C# Azure Functions backend
│   ├── Functions/         # HTTP/timer trigger functions (User, Chat, Idea, Issue, UserPreferences, AutoResolve)
│   ├── Models/            # Data models
│   ├── Services/          # Business logic (Auth, OpenAI, IdeaStorage, UserPreferences, GitHub, AutoResolve)
│   └── Utils/             # Utility functions
├── persona/               # AI persona definitions
├── docs/                  # Documentation
└── .github/workflows/     # GitHub Actions CI/CD
```

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev       # Start development server (port 5173)
npm run build     # Build for production
```

### Backend (C#)
```bash
cd backend-csharp
dotnet restore
dotnet build
func start        # Start Azure Functions locally (port 7071)
```

### Environment Variables

**Frontend (.env.development):**
```
VITE_FUNCTION_APP_URL=http://localhost:7071
VITE_BYPASS_AUTH_FOR_LOCAL_DEV=true
```

**Backend (local.settings.json):**
```json
{
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "AZURE_OPENAI_ENDPOINT": "https://your-openai.openai.azure.com/",
    "AZURE_OPENAI_KEY": "your-key",
    "AZURE_OPENAI_DEPLOYMENT": "chat",
    "WHITELISTED_EMAILS": "user1@example.com,user2@example.com",
    "BYPASS_AUTH_FOR_LOCAL_DEV": "true",
    "GITHUB_TOKEN": "your-github-pat-here"
  }
}
```

## Slash Commands

| Command | Description |
|---|---|
| `/idea <text>` | Submit an idea (max 500 chars) |
| `/idea delete <n>` | Delete idea number `n` from the list |
| `/ideas` | List all submitted ideas |
| `/issue <title>` | Create a GitHub issue (max 256 chars) |
| `/chatmode` | Show current chat mode |
| `/chatmode fun\|normal` | Change chat mode |

## Auto-Resolve

The `AutoResolve` timer function runs daily at 02:00 UTC. It:
1. Fetches open GitHub issues labelled `from-chat` that do not yet have the `autoresolve` label
2. Uses Azure OpenAI to generate an implementation plan and code changes
3. Commits the changes to a new branch and opens a pull request that closes the issue

Requires `GITHUB_TOKEN` with `repo` scope and `AZURE_OPENAI_*` variables to be configured.

## Security

- Authentication required for all endpoints
- Email whitelist enforced on backend
- Easy Auth handles OAuth flow
- API keys stored in Azure configuration (not in code)
- HTTPS enforced by Azure
- CORS configured for specific origins


## License

ISC

## Author

Built with ❤️ and GitHub Copilot
