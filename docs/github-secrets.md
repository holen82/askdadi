# GitHub Secrets Configuration

This guide explains the GitHub secrets needed for CI/CD deployment.

## Required Secrets

### For Backend Deployment

**`AZURE_FUNCTIONAPP_PUBLISH_PROFILE`**
- Description: Publish profile for Azure Function App
- How to get:
  1. Go to Azure Portal → Your Function App
  2. Click **Get publish profile** in top menu
  3. Open downloaded file and copy entire contents
  4. Paste into GitHub secret

### For Frontend Deployment

**`AZURE_STORAGE_ACCOUNT_KEY`**
- Description: Access key for Storage account (simpler method)
- How to get:
  1. Go to Azure Portal → Your Storage Account
  2. Navigate to **Security + networking** → **Access keys**
  3. Click **Show** next to key1 or key2
  4. Copy the **Key** value
  5. Add as GitHub secret

Or using Azure CLI:
```bash
az storage account keys list \
  --resource-group <resource-group> \
  --account-name <storage-account> \
  --query '[0].value' \
  --output tsv
```

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: (e.g., `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`)
   - Secret: Paste the value
5. Click **Add secret**

## Workflow Configuration

Update the workflow files with your actual resource names:

### `.github/workflows/backend-deploy.yml`
```yaml
env:
  AZURE_FUNCTIONAPP_NAME: 'your-function-app-name'  # Change this
```

### `.github/workflows/frontend-deploy.yml`
```yaml
env:
  STORAGE_ACCOUNT_NAME: 'your-storage-account'      # Change this
  FUNCTION_APP_URL: 'https://your-function-app.azurewebsites.net'  # Change this
```

## Testing Workflows

### Trigger manually:
1. Go to **Actions** tab in GitHub
2. Select workflow (Backend or Frontend deploy)
3. Click **Run workflow**
4. Select branch (usually `master`)
5. Click **Run workflow**

### Trigger by push:
- Push changes to `master` branch
- Changes in `backend-csharp/**` trigger backend deploy
- Changes in `frontend/**` trigger frontend deploy

## Troubleshooting

### Workflow fails with "Secret not found"
- Verify secret name matches exactly (case-sensitive)
- Check secret is set at repository level (not environment)

### Backend: "Authentication failed"
- Re-download fresh publish profile from Azure
- Ensure no extra whitespace when pasting
- Check Function App name in workflow matches reality

### Frontend: "Storage authentication failed"
- Verify storage account key is correct
- Check storage account name in workflow matches reality
- Regenerate storage key if needed

## Security Notes

- Never commit secrets to the repository
- Secrets are encrypted by GitHub
- Rotate secrets if accidentally exposed
- Use separate secrets for different environments
