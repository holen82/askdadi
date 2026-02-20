# CRITICAL: Flex Consumption Requires Service Principal

## Your Function App Setup

- **Plan Type**: Flex Consumption (newer plan)
- **OS**: Linux
- **Resource Group**: rg-dadi
- **Function App**: fa-dadi

## Publish Profile Won't Work

Flex Consumption plans **do not support** traditional publish profile deployment. You **must** use Service Principal authentication.

## What You Need to Do

Follow the guide to create a Service Principal:
📖 **`docs/create-service-principal-portal.md`**

### Quick Summary:

1. **Create App Registration** in Azure Portal
2. **Create Client Secret**
3. **Assign Contributor Role** to Function App
4. **Create JSON** with:
   - clientId
   - clientSecret
   - subscriptionId
   - tenantId
5. **Add to GitHub** as `AZURE_CREDENTIALS` secret

## After Adding AZURE_CREDENTIALS

The updated workflow will:
- ✅ Use Linux runner (ubuntu-latest)
- ✅ Use Azure CLI deployment
- ✅ Enable remote build (required for Flex)
- ✅ Deploy source code (not binaries)
- ✅ Azure builds it on their infrastructure

## Why This Is Different

Traditional plans use ZIP Deploy, but **Flex Consumption**:
- Builds your code **remotely** on Azure using Oryx
- Requires Service Principal for deployment
- Uses different deployment endpoints
- Has different infrastructure

This is why all previous attempts failed - the deployment method was incompatible with Flex Consumption!

## Verification

After successful deployment:

1. Azure Portal → Function App → Functions
   - You should see `chat` and `user` functions

2. Test:
```bash
curl https://fa-dadi.azurewebsites.net/user
# Should return 401 (expected - needs auth)
```

The workflow is now updated and ready - just needs the `AZURE_CREDENTIALS` secret!
