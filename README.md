# Dadi - AI Assistant Chatbot

A secure, Azure-hosted AI chatbot application with Google OAuth authentication and whitelist-based access control.

## Features

- 🔐 **Google OAuth Authentication** - Secure login via Azure Static Web Apps
- 👥 **Whitelist-based Access** - Control who can use the application
- 🤖 **Azure OpenAI Integration** - Powered by GPT models
- 💬 **Modern Chat Interface** - Clean, responsive UI with message formatting
- ☁️ **Fully Cloud-hosted** - Deployed on Azure Static Web Apps + Functions
- 🚀 **Auto-deployment** - GitHub Actions CI/CD pipeline

## Architecture

- **Frontend**: TypeScript + Vite + Vanilla TS
- **Backend**: Azure Functions (Node.js)
- **AI**: Azure OpenAI Service
- **Auth**: Azure Static Web Apps built-in authentication (Google)
- **Hosting**: Azure Static Web Apps
- **Deployment**: GitHub Actions

## Quick Start

### Prerequisites

- Azure subscription with:
  - Azure Static Web Apps resource
  - Azure OpenAI resource with deployed model
  - Google OAuth credentials configured
- GitHub repository connected to Azure SWA

### Setup

1. **Configure Azure Resources**
   - Follow [docs/azure-setup.md](docs/azure-setup.md) to create required resources

2. **Configure Function App**
   - Set environment variables in Azure Function App (see [docs/configuration.md](docs/configuration.md)):
     - `AZURE_OPENAI_ENDPOINT`
     - `AZURE_OPENAI_KEY`
     - `AZURE_OPENAI_DEPLOYMENT`
     - `WHITELISTED_EMAILS`

3. **Deploy**
   - Push to `master` branch to trigger automatic deployment via GitHub Actions

4. **Access**
   - Navigate to your Azure Static Web App URL
   - Login with Google using a whitelisted email
   - Start chatting with Dadi!

## Documentation

- [Azure Setup Guide](docs/azure-setup.md) - Create Azure resources
- [Configuration Guide](docs/configuration.md) - Configure the application
- [GitHub Secrets Setup](docs/github-secrets.md) - Configure GitHub Actions

## Project Structure

```
dadi/
├── frontend/              # Frontend application
│   ├── src/
│   │   ├── components/    # UI components (Header, Chat, Message)
│   │   ├── services/      # API services (chat, user)
│   │   ├── styles/        # CSS stylesheets
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions (auth guard)
│   └── public/            # Static assets
├── backend/               # Azure Functions backend
│   ├── functions/         # Function endpoints (user, chat)
│   └── shared/            # Shared utilities (auth, OpenAI)
├── docs/                  # Documentation
└── .github/workflows/     # GitHub Actions CI/CD
```

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev       # Start development server
npm run build     # Build for production
```

### Backend
```bash
cd backend
npm install
npm run build     # Compile TypeScript
npm start         # Start Azure Functions locally
```

## Security

- Authentication required for all endpoints
- Email whitelist enforced on backend
- API keys stored in Azure configuration (not in code)
- HTTPS enforced by Azure Static Web Apps

## Cost Estimate

For 3 users with moderate usage:
- Static Web App: Free tier (100 GB bandwidth/month)
- Function App: ~$0.20 per million executions
- Azure OpenAI: Variable (~$0.001-0.06 per 1K tokens)
- Application Insights: First 5 GB/month free

**Estimated: $20-50/month**

## License

ISC

## Author

Built with ❤️ and GitHub Copilot
