# Deployment Checklist - New Architecture

Use this checklist to deploy the new Azure Storage + Function App architecture.

## Pre-Deployment

- [ ] Review [swa-migration.md](swa-migration.md) for context
- [ ] Have Azure subscription ready
- [ ] Have Azure CLI installed (optional, can use Portal)
- [ ] Have GitHub access to repository

## Phase 1: Azure Resources

### Storage Account
- [ ] Create Azure Storage account
  - Follow: [azure-storage-setup.md](azure-storage-setup.md)
  - Name: ________________
  - URL: https://_____________.z13.web.core.windows.net
- [ ] Enable static website hosting
- [ ] Set index and error documents to `index.html`
- [ ] Note the primary endpoint URL

### Function App
- [ ] Create Azure Function App
  - Follow: [function-app-setup.md](function-app-setup.md)
  - Name: ________________
  - Runtime: .NET 8 isolated
  - URL: https://_____________.azurewebsites.net
- [ ] Create storage account for Function App (if needed)

## Phase 2: Function App Configuration

### Environment Variables
Set in Function App Configuration:

- [ ] `AZURE_OPENAI_ENDPOINT` = _______________________
- [ ] `AZURE_OPENAI_KEY` = _______________________
- [ ] `AZURE_OPENAI_DEPLOYMENT` = chat (or your model name)
- [ ] `WHITELISTED_EMAILS` = email1@example.com,email2@example.com
- [ ] `ALLOWED_ORIGINS` = (your Storage website URL)

### Easy Auth (Google OAuth)
- [ ] Go to Google Cloud Console
- [ ] Create OAuth 2.0 credentials
  - Client ID: _______________________
  - Client Secret: _______________________
  - Redirect URI: `https://<function-app>.azurewebsites.net/.auth/login/google/callback`
- [ ] Enable Authentication on Function App
- [ ] Add Google identity provider
- [ ] Use credentials from above
- [ ] Set to "Require authentication"
- [ ] Save configuration

### CORS
- [ ] Add Storage website URL to CORS allowed origins
- [ ] Enable "Access-Control-Allow-Credentials"
- [ ] Save configuration

## Phase 3: GitHub Configuration

### Update Workflow Files

In `.github/workflows/backend-deploy.yml`:
- [ ] Set `AZURE_FUNCTIONAPP_NAME` to your Function App name

In `.github/workflows/frontend-deploy.yml`:
- [ ] Set `STORAGE_ACCOUNT_NAME` to your Storage account name
- [ ] Set `FUNCTION_APP_URL` to your Function App URL

### GitHub Secrets

Add these secrets (Settings → Secrets → Actions):

- [ ] `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
  - Get from: Function App → Get publish profile
- [ ] `AZURE_CREDENTIALS`
  - Get from: `az ad sp create-for-rbac ...` (see [github-secrets.md](github-secrets.md))

## Phase 4: Initial Deployment

### Backend Deployment
- [ ] Go to GitHub Actions
- [ ] Run "Deploy C# Backend to Azure Function App" manually
- [ ] Wait for completion
- [ ] Check for errors
- [ ] Verify Function App shows deployed code

### Frontend Deployment
- [ ] Go to GitHub Actions
- [ ] Run "Deploy Frontend to Azure Storage" manually
- [ ] Wait for completion
- [ ] Check for errors
- [ ] Verify Storage `$web` container has files

## Phase 5: Testing

### Test Backend Endpoints
- [ ] Open: `https://<function-app>.azurewebsites.net/`
- [ ] Should redirect to Google login
- [ ] Complete login
- [ ] Test: `https://<function-app>.azurewebsites.net/user`
  - Should return user info JSON
- [ ] Test: `https://<function-app>.azurewebsites.net/chat` (POST)
  - Should accept messages and return responses

### Test Frontend
- [ ] Open Storage website URL
- [ ] Should redirect to Google login (via Function App)
- [ ] Complete login
- [ ] Should see chat interface
- [ ] Send a test message
- [ ] Verify AI responds

### Test Whitelist
- [ ] Try logging in with non-whitelisted email
- [ ] Should see "User not authorized" error
- [ ] Verify whitelisted email works

## Phase 6: Monitoring

### Set Up Alerts (Optional)
- [ ] Configure Application Insights alerts
- [ ] Set up email notifications for errors
- [ ] Configure budget alerts

### Verify Logging
- [ ] Check Application Insights shows requests
- [ ] Verify logs are being captured
- [ ] Test Log Stream in Function App

## Phase 7: Clean Up

### Archive Old Code
- [ ] Rename `backend/` to `backend-old/` (Node.js version)
- [ ] Add to .gitignore if desired
- [ ] Keep for reference or delete

### Remove Old SWA (Optional)
- [ ] Delete or disable old SWA GitHub workflow
- [ ] In Azure Portal, delete SWA resource (if no longer needed)
- [ ] Remove `AZURE_STATIC_WEB_APPS_API_TOKEN` secret

## Verification Checklist

Final verification that everything works:

- [ ] Frontend loads from Storage URL
- [ ] Google OAuth login works
- [ ] Whitelisted users can access
- [ ] Non-whitelisted users are blocked
- [ ] Chat functionality works
- [ ] AI responses are correct
- [ ] No CORS errors in browser console
- [ ] Automatic deployment works on push to master
- [ ] Application Insights shows telemetry

## Rollback Plan

If something goes wrong:

1. [ ] Revert GitHub repository to previous commit
2. [ ] Old SWA should still work (if not deleted)
3. [ ] Can redeploy old version

## Notes

Date deployed: __________________

Issues encountered:
- 
- 
- 

Customizations made:
- 
- 
- 

URLs for reference:
- Storage: ______________________________________
- Function App: _________________________________
- Application Insights: _________________________
