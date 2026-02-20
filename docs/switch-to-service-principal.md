# Switch Backend to Service Principal Authentication

The publish profile method is having issues. Let's switch to Service Principal authentication.

## Step 1: Create Service Principal

Run these commands in your terminal (Azure CLI required):

```bash
# Get your subscription ID
az account show --query id --output tsv

# Set variables (replace with your actual values)
SUBSCRIPTION_ID="<your-subscription-id-from-above>"
RESOURCE_GROUP="<your-resource-group-name>"
FUNCTION_APP="fa-dadi"

# Create service principal
az ad sp create-for-rbac \
  --name "github-deploy-fa-dadi" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FUNCTION_APP" \
  --json-auth
```

**You'll get JSON output like this:**
```json
{
  "clientId": "abcd1234-...",
  "clientSecret": "secret-value-...",
  "subscriptionId": "sub-id-...",
  "tenantId": "tenant-id-...",
  "resourceManagerEndpointUrl": "..."
}
```

**Copy the entire JSON output!**

## Step 2: Add GitHub Secret

1. Go to GitHub → Settings → Secrets → Actions
2. Click **New repository secret**
3. Name: `AZURE_CREDENTIALS`
4. Value: Paste the entire JSON from above
5. Click **Add secret**

## Step 3: Update Workflow File

Replace the content of `.github/workflows/backend-deploy.yml` with:

```yaml
name: Deploy C# Backend to Azure Function App

on:
  push:
    branches:
      - master
      - main
    paths:
      - 'backend-csharp/**'
      - '.github/workflows/backend-deploy.yml'
  workflow_dispatch:

env:
  AZURE_FUNCTIONAPP_NAME: 'fa-dadi'
  AZURE_FUNCTIONAPP_PACKAGE_PATH: 'backend-csharp'
  DOTNET_VERSION: '8.0.x'

jobs:
  build-and-deploy:
    runs-on: windows-latest
    
    steps:
    - name: 'Checkout GitHub Action'
      uses: actions/checkout@v4

    - name: Setup .NET SDK
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: ${{ env.DOTNET_VERSION }}

    - name: 'Resolve Project Dependencies'
      shell: pwsh
      run: |
        pushd './${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}'
        dotnet restore
        dotnet build --configuration Release --output ./output
        popd

    - name: 'Azure Login'
      uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: 'Run Azure Functions Action'
      uses: Azure/functions-action@v1
      with:
        app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
        package: '${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}/output'
    
    - name: 'Azure Logout'
      run: |
        az logout
      if: always()
```

Or just copy the file I created: `backend-deploy-sp.yml` and replace your current `backend-deploy.yml`

## Step 4: Test Deployment

1. Commit and push the updated workflow
2. Go to GitHub Actions
3. Run the workflow manually
4. Should now authenticate successfully!

## Why Service Principal is Better

- ✅ More reliable authentication
- ✅ Doesn't expire like publish profiles
- ✅ Can be scoped to specific resources
- ✅ Better for CI/CD pipelines
- ✅ Easier to rotate credentials

## Cleanup (Optional)

After successful deployment, you can remove the old secret:
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` (no longer needed)
