# Create Service Principal for GitHub - Azure Portal Guide

This guide shows how to create a Service Principal through the Azure Portal web interface (no CLI needed).

## Step 1: Register an Application (App Registration)

1. Go to [Azure Portal](https://portal.azure.com)
2. In the search bar at the top, type **"App registrations"**
3. Click **App registrations** from the results
4. Click **+ New registration** (top left)

**Fill in the form:**
- **Name**: `github-deploy-fa-dadi` (or any name you prefer)
- **Supported account types**: Select **"Accounts in this organizational directory only"**
- **Redirect URI**: Leave blank (not needed)
- Click **Register**

✅ **You've created the app registration!**

**Save these values (you'll need them later):**
- Copy the **Application (client) ID** (looks like: `12345678-1234-1234-1234-123456789abc`)
- Copy the **Directory (tenant) ID** (looks like: `87654321-4321-4321-4321-987654321abc`)

## Step 2: Create a Client Secret

While still on the app registration page:

1. In the left menu, click **Certificates & secrets**
2. Click the **Client secrets** tab
3. Click **+ New client secret**

**Fill in:**
- **Description**: `GitHub Actions Deployment`
- **Expires**: Choose **180 days** or **Custom** (24 months recommended)
- Click **Add**

⚠️ **IMPORTANT:** 
- Copy the **Value** immediately (it will only be shown once!)
- This is your **Client Secret** (looks like: `abc123~DEF456-ghi789...`)
- If you miss it, you'll need to create a new secret

## Step 3: Get Your Subscription ID

1. In the Azure Portal search bar, type **"Subscriptions"**
2. Click **Subscriptions**
3. Click on your subscription name
4. Copy the **Subscription ID** (looks like: `aaaabbbb-cccc-dddd-eeee-ffffgggghhh`)

## Step 4: Assign Role to Service Principal

Now give the service principal permission to deploy to your Function App:

1. In Azure Portal, navigate to your **Function App** (`fa-dadi`)
2. In the left menu, click **Access control (IAM)**
3. Click **+ Add** → **Add role assignment**

**On the "Role" tab:**
4. Search for and select **Contributor**
5. Click **Next**

**On the "Members" tab:**
6. Under "Assign access to", select **User, group, or service principal**
7. Click **+ Select members**
8. In the search box, type **`github-deploy-fa-dadi`** (the name you used earlier)
9. Click on your app when it appears
10. Click **Select**
11. Click **Review + assign**
12. Click **Review + assign** again to confirm

✅ **Service Principal now has access to deploy to your Function App!**

## Step 5: Create the JSON for GitHub Secret

Now create the JSON that GitHub needs:

```json
{
  "clientId": "YOUR-APPLICATION-CLIENT-ID-FROM-STEP-1",
  "clientSecret": "YOUR-CLIENT-SECRET-VALUE-FROM-STEP-2",
  "subscriptionId": "YOUR-SUBSCRIPTION-ID-FROM-STEP-3",
  "tenantId": "YOUR-DIRECTORY-TENANT-ID-FROM-STEP-1"
}
```

**Replace the values with what you copied:**
- `clientId` = Application (client) ID from Step 1
- `clientSecret` = Secret value from Step 2  
- `subscriptionId` = Subscription ID from Step 3
- `tenantId` = Directory (tenant) ID from Step 1

**Example (with fake values):**
```json
{
  "clientId": "12345678-1234-1234-1234-123456789abc",
  "clientSecret": "abc123~DEF456-ghi789~xyz",
  "subscriptionId": "aaaabbbb-cccc-dddd-eeee-ffffgggghhh",
  "tenantId": "87654321-4321-4321-4321-987654321abc"
}
```

Copy this entire JSON (with your actual values)!

## Step 6: Add to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In left menu, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

**Fill in:**
- **Name**: `AZURE_CREDENTIALS`
- **Secret**: Paste the entire JSON from Step 5
- Click **Add secret**

✅ **GitHub secret is configured!**

## Step 7: Update Your Workflow File

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

## Step 8: Test the Deployment

1. Commit and push the updated workflow file
2. Go to GitHub → **Actions** tab
3. Select "Deploy C# Backend to Azure Function App"
4. Click **Run workflow**
5. Select `master` branch
6. Click **Run workflow**

🎉 **It should now deploy successfully!**

## Troubleshooting

### "The client does not have authorization"
- **Solution**: Go back to Step 4 and verify the service principal has "Contributor" role on the Function App

### "Invalid client secret"
- **Solution**: Go back to Step 2 and create a new client secret (you may have copied it wrong)

### "Subscription not found"
- **Solution**: Verify the subscription ID in Step 3

### "Invalid JSON"
- **Solution**: Check the JSON in Step 5 has no extra commas, quotes are correct, and all IDs are filled in

## Security Notes

- The client secret is sensitive - never commit it to your repository
- The secret expires (you chose the duration in Step 2)
- When it expires, create a new secret and update the GitHub secret
- You can create multiple secrets for the same app registration (for rotation)

## What You Can Delete Now

After successful deployment with Service Principal:
- You can delete the `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` secret from GitHub (no longer needed)
- The old workflow method with publish profile is replaced

## Summary of What You Created

1. **App Registration** (`github-deploy-fa-dadi`) - The identity for GitHub
2. **Client Secret** - The password for authentication
3. **Role Assignment** - Permission to deploy to your Function App
4. **GitHub Secret** - The credentials GitHub uses to authenticate

That's it! Your CI/CD is now set up with Service Principal authentication. 🚀
