# Azure Function App Setup for Dadi Backend

This guide covers setting up a C# Azure Function App with Easy Auth for the Dadi backend.

## Prerequisites

- Azure subscription
- Azure CLI or Azure Portal access
- Resource group created

## Step 1: Create Function App

### Using Azure CLI

```bash
# Set variables
RESOURCE_GROUP="dadi-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="dadifunctionstorage"  # For Function App storage
FUNCTION_APP_NAME="dadi-func"  # Must be globally unique
OPENAI_ENDPOINT="https://your-openai.openai.azure.com/"
OPENAI_KEY="your-key-here"
OPENAI_DEPLOYMENT="chat"
WHITELISTED_EMAILS="user1@example.com,user2@example.com"
STORAGE_WEBSITE_URL="https://yourstorageaccount.z13.web.core.windows.net"

# Create storage account for Function App
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create Function App (.NET 8 isolated)
az functionapp create \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --storage-account $STORAGE_ACCOUNT \
  --consumption-plan-location $LOCATION \
  --runtime dotnet-isolated \
  --runtime-version 8 \
  --functions-version 4 \
  --os-type Windows

# Configure Function App settings
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT \
    AZURE_OPENAI_KEY=$OPENAI_KEY \
    AZURE_OPENAI_DEPLOYMENT=$OPENAI_DEPLOYMENT \
    WHITELISTED_EMAILS=$WHITELISTED_EMAILS \
    ALLOWED_ORIGINS=$STORAGE_WEBSITE_URL
```

### Using Azure Portal

1. Go to Azure Portal
2. Create a resource → Function App
3. Fill in details:
   - **Function App name**: Choose unique name
   - **Runtime stack**: .NET
   - **Version**: 8 (LTS) Isolated Worker Model
   - **Region**: Your preferred region
   - **Operating System**: Windows
   - **Plan type**: Consumption (Serverless)
4. Review + Create
5. After creation, go to Configuration → Application settings
6. Add the required environment variables (see Configuration section)

## Step 2: Configure Easy Auth

### Using Azure Portal

1. Navigate to your Function App
2. In left menu, select **Authentication**
3. Click **Add identity provider**
4. Select **Google**
5. Configure Google OAuth:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
   - **Allowed token audiences**: (leave default)
   - **Allowed scopes**: openid profile email
6. Under **App registration**:
   - Choose **Provide the details of an existing app registration**
   - Or **Create new app registration**
7. Under **Restrict access**:
   - Choose **Require authentication**
   - **Unauthenticated requests**: Return HTTP 401 Unauthorized
8. **Save**

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (if you don't have one)
3. Go to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://<your-function-app-name>.azurewebsites.net/.auth/login/google/callback
     ```
5. Copy **Client ID** and **Client Secret**
6. Use these in Azure Easy Auth configuration

## Step 3: Configure CORS

### Using Azure CLI

```bash
az functionapp cors add \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins $STORAGE_WEBSITE_URL

# Enable credentials
az functionapp config set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --generic-configurations '{"cors":{"supportCredentials":true}}'
```

### Using Azure Portal

1. Navigate to your Function App
2. Select **CORS** in left menu
3. Add your Storage static website URL:
   ```
   https://yourstorageaccount.z13.web.core.windows.net
   ```
4. Enable **Access-Control-Allow-Credentials**
5. **Save**

## Step 4: Get Publish Profile

For GitHub Actions deployment:

1. Navigate to your Function App
2. Click **Get publish profile** (top menu)
3. Download the file
4. Copy its contents
5. Add to GitHub Secrets as `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

Or use Azure CLI:
```bash
az functionapp deployment list-publishing-profiles \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --xml
```

## Configuration Settings

Required environment variables in Function App Configuration:

| Setting | Description | Example |
|---------|-------------|---------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | `https://your-openai.openai.azure.com/` |
| `AZURE_OPENAI_KEY` | API key for OpenAI | `abc123...` |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment/model name | `chat` or `gpt-4` |
| `WHITELISTED_EMAILS` | Comma-separated allowed emails | `user1@gmail.com,user2@gmail.com` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | Storage website URL |

## Testing

### Test locally

```bash
cd backend-csharp
func start
```

Access:
- User endpoint: `http://localhost:7071/user`
- Chat endpoint: `http://localhost:7071/chat`

### Test in Azure

After deployment:
- User endpoint: `https://<function-app-name>.azurewebsites.net/user`
- Chat endpoint: `https://<function-app-name>.azurewebsites.net/chat`

Test authentication:
1. Navigate to: `https://<function-app-name>.azurewebsites.net/.auth/login/google`
2. Complete Google OAuth
3. Test API endpoints with authenticated session

## Monitoring

1. Navigate to Function App
2. Select **Application Insights** (created automatically)
3. View:
   - Live metrics
   - Logs
   - Failures
   - Performance

Or use Log stream:
```bash
az webapp log tail \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

## Troubleshooting

### 401 Unauthorized
- Check Easy Auth is configured correctly
- Verify whitelist includes your email
- Check cookies are being sent (credentials: include)

### CORS errors
- Verify Storage URL is in CORS allowed origins
- Enable credentials support
- Check both host.json and Function App CORS settings

### 500 Internal Server Error
- Check Application Insights logs
- Verify all environment variables are set
- Check OpenAI endpoint and key are valid

## Cost Estimate

- **Function App (Consumption)**: ~$0-20/month
  - First 1M executions free
  - $0.20 per million thereafter
- **Storage (for Function App)**: ~$0.50/month
- **Application Insights**: First 5 GB free

Total: **~$1-20/month** depending on usage
