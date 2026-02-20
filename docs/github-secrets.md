# GitHub Secrets Configuration

This document lists all required GitHub secrets for CI/CD workflows.

## Required Secrets

Navigate to your GitHub repository > **Settings** > **Secrets and variables** > **Actions** to add these secrets.

### 1. AZURE_STATIC_WEB_APPS_API_TOKEN

**Description**: Deployment token for Azure Static Web Apps

**How to get it**:
1. Go to your Azure Static Web App in Azure Portal
2. Navigate to **Settings** > **Configuration**
3. Click **Manage deployment token**
4. Copy the token value

**Used by**: `.github/workflows/frontend-deploy.yml`

### 2. AZURE_FUNCTION_APP_NAME

**Description**: Name of your Azure Function App

**Value**: The name you gave your Function App (e.g., `func-ai-chatbot`)

**How to get it**:
- It's the name visible in Azure Portal under your Function App resource

**Used by**: `.github/workflows/backend-deploy.yml`

### 3. AZURE_FUNCTION_APP_PUBLISH_PROFILE

**Description**: Publish profile credentials for Azure Function App deployment

**How to get it**:
1. Go to your Azure Function App in Azure Portal
2. Click **Overview** > **Get publish profile** (in the top menu)
3. Save the downloaded `.PublishSettings` file
4. Open the file and copy its entire XML content
5. Paste the XML content as the secret value

**Used by**: `.github/workflows/backend-deploy.yml`

## Verification Checklist

After adding secrets, verify:

- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` added and value is not empty
- [ ] `AZURE_FUNCTION_APP_NAME` added with correct Function App name
- [ ] `AZURE_FUNCTION_APP_PUBLISH_PROFILE` added with complete XML content
- [ ] Secrets are marked as "Secrets" (not "Variables") in GitHub
- [ ] No extra whitespace or newlines in secret values

## Testing the Secrets

To test if secrets are configured correctly:

1. Make a small change to a file in `frontend/` folder
2. Commit and push to `main` branch
3. Go to **Actions** tab in GitHub
4. Check if "Deploy Frontend to Azure Static Web Apps" workflow runs successfully
5. Repeat for backend by changing a file in `backend/` folder

## Security Notes

- Never commit secrets to the repository
- Never share secret values in issues or pull requests
- Rotate secrets if they're accidentally exposed
- Use separate secrets for production and staging environments (if applicable)
- GitHub secrets are encrypted and only exposed to workflow runs

## Troubleshooting

**Error: "Secret AZURE_STATIC_WEB_APPS_API_TOKEN is not set"**
- Solution: Verify the secret name is exactly as shown (case-sensitive)

**Error: "Authentication failed" during Function App deployment**
- Solution: Re-download and update the publish profile secret

**Error: "Resource not found"**
- Solution: Verify AZURE_FUNCTION_APP_NAME matches exactly with Azure resource name
