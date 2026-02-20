# Azure Setup Instructions

This document provides step-by-step instructions for setting up the required Azure resources manually via the Azure Portal.

## Prerequisites
- Azure account with active subscription
- Azure CLI installed (optional, for verification)
- Access to Azure OpenAI (requires application approval)

## Step 1: Create Resource Group

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Click **Resource groups** in the left menu
3. Click **+ Create**
4. Fill in:
   - **Subscription**: Select your subscription
   - **Resource group**: `rg-ai-chatbot` (or your preferred name)
   - **Region**: Choose closest region (e.g., `East US`, `West Europe`)
5. Click **Review + create**, then **Create**
6. Note the resource group name for later use

## Step 2: Create Azure Static Web App

1. In Azure Portal, click **+ Create a resource**
2. Search for **Static Web Apps** and select it
3. Click **Create**
4. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: Select the resource group created above
   - **Name**: `swa-ai-chatbot` (must be globally unique)
   - **Plan type**: **Free**
   - **Region**: Choose closest region
   - **Deployment details**: Choose **Other** (we'll configure GitHub Actions separately)
5. Click **Review + create**, then **Create**
6. After deployment, go to the resource and note:
   - **URL**: The default `.azurestaticapps.net` URL
   - **API key**: Found under Settings > Configuration > Deployment token
7. **Configure authentication** (for Google OAuth):
   - Go to **Settings > Authentication**
   - Click **Add provider**
   - Select **Google**
   - Enter Google OAuth credentials (see Auth Configuration section below)

## Step 3: Create Azure Function App

1. In Azure Portal, click **+ Create a resource**
2. Search for **Function App** and select it
3. Click **Create**
4. Fill in **Basics**:
   - **Subscription**: Your subscription
   - **Resource group**: Same as above
   - **Function App name**: `func-ai-chatbot` (must be globally unique)
   - **Runtime stack**: **Node.js**
   - **Version**: Latest LTS (18 or 20)
   - **Region**: Same as Static Web App
   - **Operating System**: **Linux**
   - **Plan type**: **Consumption (Serverless)**
5. Click **Review + create**, then **Create**
6. After deployment, note the Function App name

## Step 4: Create Azure OpenAI Resource

**Note**: Azure OpenAI requires application approval. Apply at: https://aka.ms/oai/access

1. In Azure Portal, click **+ Create a resource**
2. Search for **Azure OpenAI** and select it
3. Click **Create**
4. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: Same as above
   - **Region**: Choose a region with OpenAI availability (e.g., `East US`, `Sweden Central`)
   - **Name**: `openai-ai-chatbot` (must be globally unique)
   - **Pricing tier**: **Standard S0**
5. Click **Review + create**, then **Create**
6. After deployment, go to the resource:
   - Click **Keys and Endpoint**
   - Note **KEY 1** and **Endpoint**
   - Go to **Model deployments** > **Create**
   - Deploy model:
     - **Model**: `gpt-4o` or `gpt-4` (recommended) or `gpt-35-turbo` (cheaper)
     - **Deployment name**: `chat` (remember this name)

## Step 5: Create Application Insights

1. In Azure Portal, click **+ Create a resource**
2. Search for **Application Insights** and select it
3. Click **Create**
4. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: Same as above
   - **Name**: `appi-ai-chatbot`
   - **Region**: Same as other resources
   - **Resource Mode**: **Workspace-based** (creates a Log Analytics workspace)
5. Click **Review + create**, then **Create**
6. After deployment, go to the resource:
   - Note the **Instrumentation Key** and **Connection String**

## Step 6: Link Function App to Application Insights

1. Go to your Function App resource
2. Navigate to **Settings > Configuration**
3. Find or add `APPLICATIONINSIGHTS_CONNECTION_STRING` application setting
4. Set value to the Connection String from Application Insights
5. Click **Save**

## Step 7: Configure Function App Settings

Add the following Application Settings in your Function App:

1. Go to Function App > **Settings > Configuration**
2. Under **Application settings**, add:
   - `AZURE_OPENAI_ENDPOINT`: Your OpenAI endpoint
   - `AZURE_OPENAI_KEY`: Your OpenAI API key
   - `AZURE_OPENAI_DEPLOYMENT`: Your deployment name (e.g., `chat`)
   - `WHITELISTED_EMAILS`: Comma-separated list of allowed email addresses
   - `NODE_ENV`: `production`
3. Click **Save**

## Verification Checklist

- [ ] Resource Group created
- [ ] Static Web App created and accessible
- [ ] Function App created
- [ ] Azure OpenAI resource created with model deployed
- [ ] Application Insights created
- [ ] Function App linked to Application Insights
- [ ] Function App settings configured with OpenAI credentials
- [ ] Static Web App authentication provider configured

## Next Steps

After completing this setup:
1. Configure GitHub secrets for CI/CD deployment
2. Configure Google OAuth credentials
3. Deploy the application using GitHub Actions
4. Test the authentication flow

## Resource Naming Convention

| Resource Type | Name Pattern | Example |
|--------------|--------------|---------|
| Resource Group | `rg-{app-name}` | `rg-ai-chatbot` |
| Static Web App | `swa-{app-name}` | `swa-ai-chatbot` |
| Function App | `func-{app-name}` | `func-ai-chatbot` |
| OpenAI | `openai-{app-name}` | `openai-ai-chatbot` |
| App Insights | `appi-{app-name}` | `appi-ai-chatbot` |

## Cost Estimates

- **Static Web App**: Free tier (100 GB bandwidth/month)
- **Function App**: ~$0.20 per million executions (Consumption plan)
- **Azure OpenAI**: Variable based on token usage (~$0.001-0.06 per 1K tokens)
- **Application Insights**: First 5 GB/month free, then ~$2.30 per GB

**Estimated monthly cost for 3 users**: $20-50 depending on usage
