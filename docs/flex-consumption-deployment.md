# Important: Flex Consumption Plan Deployment

## Issue Discovered

Your Function App is using:
- **Plan**: Flex Consumption (newer plan type)
- **OS**: Linux

This requires a **different deployment approach** than traditional plans!

## Why Previous Methods Failed

1. **Flex Consumption** doesn't support direct ZIP Deploy the same way
2. **Linux** requires Linux-compatible build
3. Publish profile method may not work correctly with Flex plans
4. Need to use **remote build** on Azure

## Correct Deployment Method for Flex Consumption

### Option 1: Use Azure CLI with Remote Build (Recommended)

This is the most reliable method for Flex Consumption plans:

```yaml
name: Deploy C# Backend to Azure Function App (Flex Consumption)

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
    runs-on: ubuntu-latest  # Use Linux for Linux Function App
    
    steps:
    - name: 'Checkout GitHub Action'
      uses: actions/checkout@v4

    - name: Setup .NET SDK
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: ${{ env.DOTNET_VERSION }}

    - name: 'Build Project'
      shell: bash
      run: |
        cd ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
        dotnet build --configuration Release

    - name: 'Azure Login'
      uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: 'Deploy to Azure Functions with Remote Build'
      shell: bash
      run: |
        cd ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
        # Zip the source code (not build output)
        zip -r deploy.zip . -x "obj/*" -x "bin/*" -x ".git/*"
        
        # Deploy using Azure CLI with remote build
        az functionapp deployment source config-zip \
          --resource-group <YOUR-RESOURCE-GROUP> \
          --name ${{ env.AZURE_FUNCTIONAPP_NAME }} \
          --src deploy.zip \
          --build-remote true
    
    - name: 'Azure Logout'
      run: az logout
      if: always()
```

**Important**: Replace `<YOUR-RESOURCE-GROUP>` with your actual resource group name!

### Option 2: Use Function App Deployment (Alternative)

```yaml
name: Deploy C# Backend to Azure Function App (Flex)

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

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4

    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '8.0.x'

    - name: 'Azure Login'
      uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: 'Deploy via az functionapp up'
      shell: bash
      run: |
        cd ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
        az functionapp deploy \
          --resource-group <YOUR-RESOURCE-GROUP> \
          --name ${{ env.AZURE_FUNCTIONAPP_NAME }} \
          --src-path . \
          --type zip \
          --build-remote true

    - name: 'Logout'
      run: az logout
      if: always()
```

## Key Differences for Flex Consumption

1. **Use `ubuntu-latest`** runner (not `windows-latest`)
2. **Use Azure CLI** deployment (not Azure Functions Action)
3. **Enable remote build** (`--build-remote true`)
4. **Deploy source code**, not built binaries
5. **Must use Service Principal** (AZURE_CREDENTIALS), not publish profile

## Why Remote Build?

Flex Consumption plans build your code **on Azure** using Oryx build system. This ensures:
- Correct Linux dependencies
- Proper .NET 8 isolated worker setup
- Compatible with Flex infrastructure

## Setup Requirements

### 1. Get Resource Group Name

Run locally:
```bash
az functionapp show --name fa-dadi --query resourceGroup --output tsv
```

### 2. Ensure AZURE_CREDENTIALS Secret Exists

You need Service Principal authentication (not publish profile):
- Follow: `docs/create-service-principal-portal.md`
- Add `AZURE_CREDENTIALS` secret to GitHub

### 3. Update Workflow File

Replace `.github/workflows/backend-deploy.yml` with one of the options above.

Make sure to replace:
- `<YOUR-RESOURCE-GROUP>` with your actual resource group name

## Verification

After deployment, check:

1. **Azure Portal** → Function App → Functions
   - Should see `chat` and `user` functions listed

2. **Test endpoints**:
```bash
# Get Function App URL
https://fa-dadi.azurewebsites.net/user
https://fa-dadi.azurewebsites.net/chat
```

## Common Flex Consumption Issues

### "Deployment package is too large"
- Flex has different size limits
- Solution: Ensure you're not including unnecessary files

### "Function not found after deployment"
- Flex may take longer to sync functions
- Solution: Wait 2-3 minutes and check again

### "Remote build failed"
- Check Function App logs in Azure Portal
- Deployment Center → Logs

## Summary

**For Flex Consumption + Linux:**
- ✅ Use `ubuntu-latest` runner
- ✅ Use Azure CLI deployment
- ✅ Enable remote build
- ✅ Use Service Principal auth
- ❌ Don't use Windows runner
- ❌ Don't use publish profile
- ❌ Don't use Azure Functions Action v1

This is why previous methods failed - Flex Consumption requires a completely different deployment approach!
