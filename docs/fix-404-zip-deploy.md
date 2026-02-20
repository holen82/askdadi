# Fixed: 404 Error During ZIP Deploy

## Issue
After enabling SCM Basic auth, deployment progressed but failed with:
```
Failed to deploy web package to App Service.
Not Found (CODE: 404)
```

## Root Cause
The deployment was using `dotnet build --output` but .NET 8 isolated worker Functions need `dotnet publish` to include all necessary runtime dependencies.

## Solution Applied

Changed the workflow to:
1. Use `dotnet publish` instead of just `dotnet build`
2. Create a proper ZIP package from the published output
3. Added `respect-funcignore: true` flag

### What Changed

**Before:**
```yaml
- name: 'Resolve Project Dependencies'
  run: |
    dotnet restore
    dotnet build --configuration Release --output ./output
    
- name: 'Run Azure Functions Action'
  with:
    package: './output'
```

**After:**
```yaml
- name: 'Build and Publish'
  run: |
    dotnet build --configuration Release --output ./output
    dotnet publish --configuration Release --output ./publish
    Compress-Archive -Path ./publish/* -DestinationPath ./deploy.zip -Force
    
- name: 'Deploy to Azure Functions'
  with:
    package: './deploy.zip'
    respect-funcignore: true
```

## Why This Works

- `dotnet publish` includes all runtime dependencies needed for .NET 8 isolated worker
- Creates a complete deployment package with all assemblies
- ZIP format is explicitly created ensuring proper package structure
- `respect-funcignore` prevents deploying unnecessary files

## Verification

After this fix, deployment should:
1. ✅ Build successfully
2. ✅ Publish all dependencies
3. ✅ Create proper ZIP package
4. ✅ Deploy without 404 errors
5. ✅ Function App shows deployed functions

## If Still Getting Errors

### 1. Check Function App Configuration
```bash
# Verify runtime is correct
az functionapp config show --name fa-dadi --resource-group <rg> --query "linuxFxVersion"
# Should show: DOTNET-ISOLATED|8.0
```

### 2. Check Deployment Logs
- Azure Portal → Function App → Deployment Center → Logs
- Look for detailed error messages

### 3. Try Remote Build
If local build continues to fail, enable remote build:

Add to workflow after checkout:
```yaml
- name: 'Set App Settings for Remote Build'
  shell: pwsh
  run: |
    # This tells Azure to build remotely
    Add-Content -Path "${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}/.deployment" -Value "[config]"
    Add-Content -Path "${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}/.deployment" -Value "SCM_DO_BUILD_DURING_DEPLOYMENT=true"
```

## Summary

The key fix: Use `dotnet publish` for .NET 8 isolated worker Functions, not just `dotnet build`. This ensures all runtime dependencies are included in the deployment package.
