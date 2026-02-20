# Migration from SWA to Azure Storage + Function App

## Summary

This project has been migrated from Azure Static Web Apps (SWA) to a cleaner architecture with:
- **Frontend**: Azure Storage Static Website
- **Backend**: C# Azure Function App with Easy Auth

## What Changed

### Architecture
- **Before**: Monolithic SWA with built-in auth and Node.js functions
- **After**: Separated frontend (Storage) and backend (C# Functions)

### Backend Changes
- Migrated from **TypeScript/Node.js** to **C#/.NET 8**
- New location: `backend-csharp/` directory
- Function App runs in **isolated worker** mode
- Same functionality: User info endpoint and Chat endpoint
- Easy Auth replaces SWA built-in auth (same x-ms-client-principal header)

### Frontend Changes
- Frontend code mostly unchanged (still Vanilla TypeScript)
- Updated API endpoints to point to Function App URL
- Added environment variable support: `VITE_FUNCTION_APP_URL`
- Auth redirects now go to Function App's `/.auth/login/google`
- Improved TypeScript types and error handling

### Deployment Changes
- **Frontend**: Deploys to Azure Storage `$web` container
- **Backend**: Deploys to Azure Function App
- Separate GitHub Actions workflows for each
- Old SWA workflow can be removed

## Why the Migration?

SWA was causing issues:
- Limited control over backend configuration
- Difficult CORS handling
- Mixed frontend/backend deployments
- Less flexibility with authentication

New architecture provides:
- Clear separation of concerns
- Better CORS control
- Independent scaling
- More deployment flexibility
- C# for better type safety and performance

## Migration Checklist

### ✅ Completed (Automated)

- [x] Created C# Function App project
- [x] Ported authentication logic
- [x] Ported OpenAI integration
- [x] Ported user endpoint
- [x] Ported chat endpoint
- [x] Updated frontend services
- [x] Created deployment workflows
- [x] Updated documentation

### ⏳ Manual Steps Required

#### 1. Create Azure Resources

- [ ] Create Azure Storage account
- [ ] Enable static website hosting on Storage
- [ ] Create Azure Function App (.NET 8 isolated)
- [ ] Note down URLs for both resources

See: [docs/azure-storage-setup.md](azure-storage-setup.md) and [docs/function-app-setup.md](function-app-setup.md)

#### 2. Configure Function App

- [ ] Set environment variables:
  - `AZURE_OPENAI_ENDPOINT`
  - `AZURE_OPENAI_KEY`
  - `AZURE_OPENAI_DEPLOYMENT`
  - `WHITELISTED_EMAILS`
  - `ALLOWED_ORIGINS` (Storage website URL)

#### 3. Configure Easy Auth

- [ ] Enable Authentication on Function App
- [ ] Configure Google OAuth provider
- [ ] Set up Google Cloud Console OAuth credentials
- [ ] Add redirect URI to Google OAuth app
- [ ] Test login flow

See: [docs/function-app-setup.md#step-2-configure-easy-auth](function-app-setup.md#step-2-configure-easy-auth)

#### 4. Configure CORS

- [ ] Add Storage website URL to Function App CORS
- [ ] Enable credentials support
- [ ] Test cross-origin requests

#### 5. Configure GitHub Secrets

- [ ] Add `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
- [ ] Add `AZURE_CREDENTIALS` (for Storage deployment)
- [ ] Update workflow files with actual resource names

See: [docs/github-secrets.md](github-secrets.md)

#### 6. Deploy and Test

- [ ] Deploy backend (trigger workflow manually first)
- [ ] Deploy frontend (trigger workflow manually first)
- [ ] Test authentication flow end-to-end
- [ ] Test chat functionality
- [ ] Verify whitelist works correctly

#### 7. Clean Up Old Resources

- [ ] Remove old SWA GitHub workflow (optional)
- [ ] Delete Azure Static Web App resource (if desired)
- [ ] Archive old `backend/` directory (Node.js version)

## Rollback Plan

If issues arise, you can rollback:

1. Revert to previous commit before migration
2. Old SWA deployment workflow should still work
3. Old `backend/` directory contains working Node.js code

## Cost Comparison

### Before (SWA)
- Static Web App: Free tier
- Includes: Hosting + Functions + Auth
- **~$0-20/month**

### After (Storage + Functions)
- Azure Storage: ~$1-5/month
- Function App: ~$0-20/month
- Total: **~$1-25/month**

Similar or slightly lower cost with more flexibility.

## Support

For issues:
1. Check [docs/function-app-setup.md](function-app-setup.md) troubleshooting section
2. Review Application Insights logs in Azure Portal
3. Check GitHub Actions workflow logs

## Timeline

- Migration implemented: 2026-02-20
- Code changes: Complete
- Manual configuration: Pending (see checklist above)
