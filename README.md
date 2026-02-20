# Dadi - AI Assistant Chatbot

A secure, Azure-hosted AI chatbot application with Google OAuth authentication and whitelist-based access control.

## Features

- 🔐 **Google OAuth Authentication** - Secure login via Azure Easy Auth
- 👥 **Whitelist-based Access** - Control who can use the application
- 🤖 **Azure OpenAI Integration** - Powered by GPT models
- 💬 **Modern Chat Interface** - Clean, responsive UI with message formatting
- ☁️ **Fully Cloud-hosted** - Azure Storage + C# Function App
- 🚀 **Auto-deployment** - GitHub Actions CI/CD pipeline

## Architecture

- **Frontend**: TypeScript + Vite + Vanilla TS → Azure Storage Static Website
- **Backend**: C# Azure Functions (.NET 8) → Azure Function App
- **AI**: Azure OpenAI Service
- **Auth**: Azure Easy Auth on Function App (Google)
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
│   │   ├── components/    # UI components (Header, Chat, Message)
│   │   ├── services/      # API services (chat, user, auth)
│   │   ├── styles/        # CSS stylesheets
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── backend-csharp/        # C# Azure Functions backend
│   ├── Functions/         # HTTP trigger functions (User, Chat)
│   ├── Models/            # Data models
│   ├── Services/          # Business logic (Auth, OpenAI)
│   └── Utils/             # Utility functions
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
```

**Backend (local.settings.json):**
```json
{
  "Values": {
    "AZURE_OPENAI_ENDPOINT": "https://your-openai.openai.azure.com/",
    "AZURE_OPENAI_KEY": "your-key",
    "AZURE_OPENAI_DEPLOYMENT": "chat",
    "WHITELISTED_EMAILS": "user1@example.com,user2@example.com",
    "ALLOWED_ORIGINS": "http://localhost:5173"
  }
}
```

## Security

- Authentication required for all endpoints
- Email whitelist enforced on backend
- Easy Auth handles OAuth flow
- API keys stored in Azure configuration (not in code)
- HTTPS enforced by Azure
- CORS configured for specific origins

## Cost Estimate

For 3 users with moderate usage:
- Azure Storage: ~$1-5/month (static website hosting)
- Function App: Consumption plan ~$0-20/month
- Azure OpenAI: Variable (~$0.001-0.06 per 1K tokens)
- Application Insights: First 5 GB/month free

**Estimated: $15-40/month**

## Migration from SWA

This project was migrated from Azure Static Web Apps to Azure Storage + Function App architecture. See migration notes in [docs/swa-migration.md](docs/swa-migration.md).

## License

ISC

## Author

Built with ❤️ and GitHub Copilot
