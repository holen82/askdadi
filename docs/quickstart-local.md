# Quick Start - Local Development

Get the migrated Dadi chatbot running locally in minutes.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- Azure OpenAI access (optional for full functionality)

## 1. Setup Backend (C#)

```bash
cd backend-csharp

# Optional: Configure OpenAI (can skip for testing structure)
# Copy and edit local.settings.json with your Azure OpenAI credentials
# If you skip this, chat won't work but user endpoint will

# Start the backend
func start
```

You should see:
```
Functions:
  chat: [POST] http://localhost:7071/chat
  user: [GET] http://localhost:7071/user
```

✅ Backend is running on **http://localhost:7071**

## 2. Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

✅ Frontend is running on **http://localhost:5173**

## 3. Test Locally

### Without Authentication (Backend only)

Test the backend endpoints directly:

```bash
# This will fail (no auth) but proves endpoint is working
curl http://localhost:7071/user
# Expected: 401 Unauthorized

curl -X POST http://localhost:7071/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
# Expected: 401 Unauthorized
```

### With Authentication

For full local testing with auth, you would need to:
1. Set up Google OAuth credentials
2. Configure Easy Auth (typically only available in Azure)
3. Or mock the auth headers for testing

**Easier approach**: Deploy to Azure and test there with real Easy Auth.

## Quick Configuration Reference

### Backend (backend-csharp/local.settings.json)

```json
{
  "Values": {
    "AZURE_OPENAI_ENDPOINT": "https://your-openai.openai.azure.com/",
    "AZURE_OPENAI_KEY": "your-key-here",
    "AZURE_OPENAI_DEPLOYMENT": "chat",
    "WHITELISTED_EMAILS": "your-email@example.com",
    "ALLOWED_ORIGINS": "http://localhost:5173"
  }
}
```

### Frontend (frontend/.env.development)

```env
VITE_FUNCTION_APP_URL=http://localhost:7071
```

## Troubleshooting

### Backend won't start
- Check you're in `backend-csharp/` directory
- Run `dotnet build` to see any errors
- See [docs/troubleshooting.md](../docs/troubleshooting.md)

### Frontend can't reach backend
- Ensure backend is running on port 7071
- Check CORS in `backend-csharp/host.json`
- Check browser console for errors

### Both running but getting 401
- **This is expected without Easy Auth configured**
- To test with auth, deploy to Azure (see deployment guide)
- Easy Auth is not available in local development

## Next Steps

### For Full Testing
Follow [docs/deployment-checklist.md](deployment-checklist.md) to deploy to Azure.

### For Development
- Backend code: `backend-csharp/Functions/`
- Frontend code: `frontend/src/`
- Make changes and they'll auto-reload

### Run Tests
```bash
# Backend
cd backend-csharp
dotnet test  # (when tests are added)

# Frontend
cd frontend
npm run type-check
npm run build  # Verify build works
```

## Useful Commands

```bash
# Backend
dotnet build          # Build backend
dotnet clean          # Clean build artifacts
func start --verbose  # Start with detailed logging

# Frontend
npm run dev           # Dev server
npm run build         # Production build
npm run type-check    # TypeScript validation
```

## Architecture Diagram (Local)

```
┌─────────────────────┐         ┌──────────────────────┐
│  Browser            │         │  Backend             │
│  localhost:5173     │◄───────►│  localhost:7071      │
│                     │  CORS   │                      │
│  ┌──────────────┐   │         │  ┌───────────────┐  │
│  │  Frontend    │   │         │  │ C# Functions  │  │
│  │  (Vite)      │───┼────────►│  │ - /user       │  │
│  └──────────────┘   │         │  │ - /chat       │  │
│                     │         │  └───────────────┘  │
└─────────────────────┘         └──────────────────────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │ Azure OpenAI │
                                  │ (if config'd)│
                                  └──────────────┘
```

When deployed to Azure, Easy Auth sits in front of the Function App handling Google OAuth.
