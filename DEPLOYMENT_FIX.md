# Quick Fix: Deployment Authentication

## What Was Wrong

The frontend deployment workflow was trying to use **Service Principal** authentication (`AZURE_CREDENTIALS`), but you set up with **Publish Profile** instead.

## What Was Fixed

✅ Updated frontend workflow to use **Storage Account Key** authentication (simpler)
✅ Removed Azure login/logout steps
✅ Updated all documentation

## What You Need Now

### 1. Get Storage Account Key

**Using Azure Portal:**
1. Go to Azure Portal → Your Storage Account
2. Click **Security + networking** → **Access keys**
3. Click **Show** next to key1
4. Copy the **Key** value

**Using Azure CLI:**
```bash
az storage account keys list \
  --resource-group <your-rg> \
  --account-name <your-storage> \
  --query '[0].value' \
  --output tsv
```

### 2. Add GitHub Secret

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `AZURE_STORAGE_ACCOUNT_KEY`
4. Value: Paste the key you copied
5. Click **Add secret**

### 3. Update Workflow Configuration

Edit `.github/workflows/frontend-deploy.yml` (lines 14-15):

```yaml
env:
  STORAGE_ACCOUNT_NAME: 'your-actual-storage-name'  # Change this!
  FUNCTION_APP_URL: 'https://your-actual-function-app.azurewebsites.net'  # Change this!
```

Also update `.github/workflows/backend-deploy.yml` (line 13):

```yaml
env:
  AZURE_FUNCTIONAPP_NAME: 'your-actual-function-app-name'  # Change this!
```

### 4. Test the Workflow

**Option A: Manually trigger**
1. Go to GitHub → **Actions** tab
2. Select "Deploy Frontend to Azure Storage"
3. Click **Run workflow**
4. Select `master` branch
5. Click **Run workflow**

**Option B: Push a change**
```bash
# Make a small change to trigger deployment
cd frontend
echo "// Test" >> src/main.ts
git add .
git commit -m "Test deployment"
git push
```

## Current GitHub Secrets Needed

- ✅ `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` - You already have this
- ⏳ `AZURE_STORAGE_ACCOUNT_KEY` - Add this now

## Summary

The issue was using the wrong authentication method. Now it's simplified:
- **Backend**: Uses Publish Profile (already configured)
- **Frontend**: Uses Storage Account Key (simpler than Service Principal)

After adding the storage account key secret and updating the workflow configuration, your deployments should work! 🚀
