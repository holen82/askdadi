# Azure Storage Static Website Setup

This guide walks you through setting up Azure Storage for hosting the Dadi frontend.

## Prerequisites

- Azure subscription
- Azure CLI installed (or use Azure Portal)
- Resource group created

## Option 1: Azure CLI

### 1. Create Storage Account

```bash
# Set variables
RESOURCE_GROUP="dadi-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="dadistorage"  # Must be globally unique, lowercase, no hyphens

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot
```

### 2. Enable Static Website Hosting

```bash
# Enable static website
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --index-document index.html \
  --404-document index.html
```

### 3. Get Primary Endpoint URL

```bash
# Get the static website URL
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "primaryEndpoints.web" \
  --output tsv
```

The URL will be something like: `https://dadistorage.z13.web.core.windows.net/`

### 4. Configure CORS (Optional, if needed)

```bash
az storage cors add \
  --services b \
  --methods GET POST PUT \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name $STORAGE_ACCOUNT
```

### 5. Deploy Files

```bash
# Upload built frontend
az storage blob upload-batch \
  --source ./frontend/dist \
  --destination '$web' \
  --account-name $STORAGE_ACCOUNT \
  --overwrite
```

## Option 2: Azure Portal

### 1. Create Storage Account

1. Navigate to Azure Portal (portal.azure.com)
2. Click **"Create a resource"** → **"Storage account"**
3. Fill in details:
   - **Resource group**: Select or create one
   - **Storage account name**: Choose unique name (lowercase, no special chars)
   - **Region**: Select your region
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage)
4. Click **"Review + create"** → **"Create"**

### 2. Enable Static Website

1. Navigate to your storage account
2. In left menu, select **"Static website"** (under Data management)
3. Toggle **"Enabled"**
4. Set **Index document name**: `index.html`
5. Set **Error document path**: `index.html` (for SPA routing)
6. Click **"Save"**
7. Copy the **Primary endpoint** URL

### 3. Upload Files

**Using Azure Storage Explorer:**
1. Download Azure Storage Explorer
2. Connect to your storage account
3. Navigate to **"Blob Containers"** → **"$web"**
4. Upload contents of `frontend/dist` folder

**Using Azure Portal:**
1. Navigate to your storage account
2. Click **"Containers"** → **"$web"**
3. Click **"Upload"**
4. Select all files from `frontend/dist`
5. Click **"Upload"**

## Optional: Custom Domain

### Using Azure CDN

1. Navigate to your storage account
2. Select **"Azure CDN"** in left menu
3. Click **"Create new"**
4. Configure:
   - **CDN profile**: Create new or use existing
   - **Pricing tier**: Standard Microsoft
   - **CDN endpoint name**: Choose unique name
5. After creation, add custom domain in CDN endpoint settings

### Using Custom Domain (without CDN)

1. Create CNAME record pointing to storage static website URL
2. In storage account, go to **"Custom domain"**
3. Enter your custom domain name
4. Verify and save

**Note**: HTTPS with custom domain requires Azure CDN

## Configuration for Deployment

### GitHub Secrets Needed

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

**For Backend:**
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: Publish profile from Function App

**For Frontend (choose one method):**
- `AZURE_STORAGE_ACCOUNT_KEY`: Access key from Storage account (recommended for simplicity)

Or use Service Principal:
- `AZURE_CREDENTIALS`: JSON with service principal credentials

**Get Storage Account Key:**
```bash
# Using Azure Portal
# 1. Go to Storage Account → Access keys
# 2. Show and copy key1 or key2

# Using Azure CLI
az storage account keys list \
  --resource-group <resource-group> \
  --account-name <storage-account> \
  --query '[0].value' \
  --output tsv
```

## Testing

After deployment, visit your static website URL:
- `https://<storage-account>.z13.web.core.windows.net/`
- Or your custom domain if configured

## Costs

- **Storage**: ~$0.02/GB per month
- **Bandwidth**: ~$0.09/GB for first 10 TB
- **Operations**: Minimal cost for read operations

Estimated monthly cost for low-traffic site: **$1-5**

## Troubleshooting

### Files not loading
- Ensure files are uploaded to `$web` container
- Check file permissions (should be public read access)
- Verify index.html exists

### 404 errors on refresh
- Set error document to `index.html` for SPA routing

### CORS errors
- Configure CORS settings if frontend calls Function App directly
- Usually handled at Function App level, not storage
