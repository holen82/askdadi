# Troubleshooting Guide

## Common Issues and Solutions

### Backend: "Cannot access a disposed object. Object name: 'IServiceProvider'"

**Symptoms**: When running `func start`, the backend fails immediately with:
```
Cannot access a disposed object.
Object name: 'IServiceProvider'.
```

**Cause**: Incorrect service registration pattern in Program.cs or invalid local.settings.json format.

**Solution**: 
1. Use the correct Host Builder pattern with context parameter:
   ```csharp
   var host = new HostBuilder()
       .ConfigureFunctionsWebApplication()
       .ConfigureServices((context, services) =>
       {
           // Service registration
       })
       .Build();
   
   await host.RunAsync();
   ```

2. Ensure local.settings.json doesn't have invalid `Host` section (CORS is handled in host.json).

**Fixed in**: Program.cs and local.settings.json

---

### Backend: CORS Errors in Browser

**Symptoms**: Frontend can't call backend APIs, browser console shows CORS errors.

**Cause**: CORS not configured to allow Storage static website origin.

**Solution**:
1. In `host.json`, ensure CORS is configured:
   ```json
   "cors": {
       "supportCredentials": true,
       "allowedOrigins": ["*"]  // or specific origin
   }
   ```

2. In Azure Function App settings, add Storage URL to CORS allowed origins.

---

### Frontend: Environment variable not defined

**Symptoms**: Build fails with `Property 'env' does not exist on type 'ImportMeta'`

**Cause**: TypeScript doesn't know about Vite's import.meta.env

**Solution**: Create `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNCTION_APP_URL: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Fixed in**: frontend/src/vite-env.d.ts

---

### Authentication: Redirect loop or "Not authenticated"

**Symptoms**: User gets stuck in redirect loop or sees "Not authenticated" message.

**Cause**: Easy Auth not configured or not enabled on Function App.

**Solution**:
1. Enable Authentication on Function App in Azure Portal
2. Configure Google OAuth provider
3. Set redirect URIs correctly
4. Ensure cookies are being sent (credentials: 'include' in fetch)

See: [docs/function-app-setup.md](../function-app-setup.md#step-2-configure-easy-auth)

---

### Deployment: Workflow fails with "Secret not found"

**Symptoms**: GitHub Actions workflow fails immediately.

**Cause**: Required secrets not configured in GitHub repository.

**Solution**:
1. Go to GitHub repository → Settings → Secrets → Actions
2. Add required secrets:
   - `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
   - `AZURE_CREDENTIALS`
3. Ensure secret names match exactly (case-sensitive)

See: [docs/github-secrets.md](../github-secrets.md)

---

### Local Development: Functions not starting

**Symptoms**: `func start` fails or functions don't appear.

**Possible Causes & Solutions**:

1. **Missing Azure Functions Core Tools**
   - Install: `npm install -g azure-functions-core-tools@4 --unsafe-perm true`

2. **Wrong directory**
   - Ensure you're in `backend-csharp/` directory
   - Should see `host.json` in current directory

3. **Build errors**
   - Run `dotnet build` first to see any compilation errors
   - Fix any errors before running `func start`

4. **Missing local.settings.json**
   - Copy from `local.settings.json.template`
   - Fill in your values (can be empty strings for local dev)

---

### OpenAI: "OpenAI client not initialized"

**Symptoms**: Chat endpoint returns "Service Unavailable" error.

**Cause**: OpenAI environment variables not set.

**Solution**:
1. In local.settings.json (local):
   ```json
   "AZURE_OPENAI_ENDPOINT": "https://your-openai.openai.azure.com/",
   "AZURE_OPENAI_KEY": "your-key",
   "AZURE_OPENAI_DEPLOYMENT": "chat"
   ```

2. In Azure Function App Configuration:
   - Add same variables in Application settings

---

### Whitelist: All users blocked

**Symptoms**: Even whitelisted users see "User not authorized" message.

**Possible Causes**:

1. **Whitelist not set**
   - Set `WHITELISTED_EMAILS` environment variable
   - Format: `email1@example.com,email2@example.com` (comma-separated)

2. **Email format mismatch**
   - Whitelist uses lowercase comparison
   - Ensure no extra spaces in email list

3. **User email not in claims**
   - Check Application Insights logs for actual email extracted
   - Verify Google OAuth returns email claim

**Debug**: Add logging in AuthService to see extracted email vs whitelist.

---

## Getting More Help

1. **Check logs**:
   - Local: Console output when running `func start`
   - Azure: Application Insights or Log Stream in Azure Portal

2. **Enable verbose logging**:
   - Local: `func start --verbose`
   - Azure: Application Insights with detailed telemetry

3. **Common log locations**:
   - Backend: Application Insights in Azure Portal
   - Frontend: Browser DevTools console
   - Deployments: GitHub Actions workflow logs
