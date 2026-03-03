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
- **AI Auto-Resolve** - Automatically resolves GitHub issues by generating code and opening PRs
- **Mobile-Responsive UI** - Carousel-style panel navigation on mobile devices
- **PWA Support** - Installable as a Progressive Web App via service worker
- **Modern Chat Interface** - Clean, responsive UI with markdown rendering and syntax highlighting
- **Fully Cloud-hosted** - Azure App Service
- **Auto-deployment** - GitHub Actions CI/CD pipeline

## Architecture

- **Frontend**: TypeScript + Vite + Vanilla TS → bundled into `wwwroot/`, served by the backend
- **Backend**: C# ASP.NET Core (.NET 10) → Azure App Service (`app-dadi`)
- **Storage**: Azure Blob Storage (ideas, user preferences)
- **AI**: Azure OpenAI Service
- **Auth**: Azure Easy Auth on App Service (Google)
- **GitHub Integration**: GitHub API (issue creation, auto-resolve PRs)
- **Deployment**: Single GitHub Actions workflow (builds frontend + backend together)

The frontend and backend are deployed together as a single Azure App Service. The frontend is built by CI and copied into `backend-csharp/wwwroot/` before the .NET app is published. The ASP.NET Core app serves static files from `wwwroot/` and falls back to `index.html` for SPA routing.

## Quick Start

### Prerequisites

- Azure subscription with:
  - Azure App Service (Windows or Linux, .NET 10)
  - Azure Storage account (for ideas and user preferences)
  - Azure OpenAI resource with deployed model
  - Easy Auth configured on App Service (Google OAuth)
- GitHub repository with required secrets configured

### Setup

1. **Configure Azure Resources**
   - Create an Azure App Service targeting .NET 10
   - Create an Azure Storage account for blob data
   - Create an Azure OpenAI resource and deploy a model

2. **Configure App Service**
   - Set environment variables in Azure App Service → Configuration → Application settings:
     - `AZURE_OPENAI_ENDPOINT`
     - `AZURE_OPENAI_KEY`
     - `AZURE_OPENAI_DEPLOYMENT`
     - `WHITELISTED_EMAILS`
     - `AZURE_STORAGE_CONNECTION_STRING`
     - `GITHUB_TOKEN` (GitHub personal access token for issue creation and auto-resolve)

3. **Configure Easy Auth**
   - Enable Authentication on App Service
   - Add Google identity provider
   - Configure redirect URLs

4. **Deploy**
   - Push to `master` branch to trigger automatic deployment via GitHub Actions
   - The workflow builds the frontend, copies it to `wwwroot/`, then publishes the .NET project to Azure App Service

5. **Access**
   - Navigate to `https://app-dadi.azurewebsites.net`
   - Login with Google using a whitelisted email
   - Start chatting with Dadi!

## Documentation

- [Azure Setup Guide](docs/azure-setup.md) - Create Azure resources
- [Function App Setup](docs/function-app-setup.md) - Configure the App Service
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
├── backend-csharp/        # C# ASP.NET Core backend
│   ├── Controllers/       # HTTP controllers (User, Chat, Ideas, Issues, UserPreferences)
│   ├── Models/            # Data models
│   ├── Services/          # Business logic (Auth, OpenAI, IdeaStorage, UserPreferences, GitHub, AutoResolve)
│   └── wwwroot/           # Built frontend assets (populated by CI)
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
dotnet run        # Start ASP.NET Core locally (port 5000/5001 or as configured)
```

### Environment Variables

**Frontend (.env.development):**
```
VITE_FUNCTION_APP_URL=http://localhost:5000
VITE_BYPASS_AUTH_FOR_LOCAL_DEV=true
```

**Backend (appsettings.Development.json):**
```json
{
  "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true",
  "AZURE_OPENAI_ENDPOINT": "https://your-openai.openai.azure.com/",
  "AZURE_OPENAI_KEY": "your-key",
  "AZURE_OPENAI_DEPLOYMENT": "chat",
  "WHITELISTED_EMAILS": "user1@example.com,user2@example.com",
  "BYPASS_AUTH_FOR_LOCAL_DEV": "true",
  "GITHUB_TOKEN": "your-github-pat-here"
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

The `AutoResolveService` can be triggered to resolve open GitHub issues. It:
1. Fetches open GitHub issues labelled `from-chat` that do not yet have the `autoresolve` label
2. Uses Azure OpenAI to generate an implementation plan and code changes
3. Commits the changes to a new branch and opens a pull request that closes the issue

Requires `GITHUB_TOKEN` with `repo` scope and `AZURE_OPENAI_*` variables to be configured.

## Security

- Authentication required for all endpoints
- Email whitelist enforced on backend
- Easy Auth handles OAuth flow
- API keys stored in Azure App Service configuration (not in code)
- HTTPS enforced by Azure
- CORS configured for local development only


## License

ISC

## Author

Built with ❤️ and GitHub Copilot
