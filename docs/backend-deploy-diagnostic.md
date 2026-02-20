# Quick Diagnostic: Verify Publish Profile Content

The AZURE_FUNCTIONAPP_NAME should be just the simple name: `fa-dadi` (no URL, no suffixes).

## Let's verify your publish profile is correct:

### 1. Open your publish profile file (.PublishSettings)

You should see XML content. Look for these key lines:

```xml
<publishProfile 
  profileName="fa-dadi - Web Deploy"
  publishUrl="fa-dadi.scm.azurewebsites.net:443"
  userName="$fa-dadi"
  ...
```

**Check these values:**
- `publishUrl` should start with `fa-dadi.scm.azurewebsites.net`
- `userName` should start with `$fa-dadi`
- `profileName` should mention `fa-dadi`

**If any of these say a DIFFERENT name**, then you downloaded the wrong publish profile!

### 2. Verify you copied the complete XML

Your GitHub secret should look like this (with your actual values):

```xml
<?xml version="1.0" encoding="utf-8"?>
<publishData>
  <publishProfile 
    profileName="fa-dadi - Web Deploy" 
    publishMethod="MSDeploy" 
    publishUrl="fa-dadi.scm.azurewebsites.net:443" 
    msdeploySite="fa-dadi" 
    userName="$fa-dadi" 
    userPWD="LongPasswordHere..." 
    destinationAppUrl="http://fa-dadi.azurewebsites.net" 
    ...more attributes...
  >
    ...possibly more content...
  </publishProfile>
  ...possibly more profiles...
</publishData>
```

**Important:**
- Must start with `<?xml version...`
- Must end with `</publishData>`
- All on one line or multiple lines doesn't matter
- No extra spaces before `<?xml` or after `</publishData>`

### 3. Alternative Test: Try with Azure CLI Credentials

If publish profile continues to fail, let's use Azure CLI authentication instead:

**Step 1: Get your Azure subscription and resource group**

Run this locally:
```bash
az account show --query "{subscription:id, tenant:tenantId}"
az group show --name <your-resource-group> --query "{id:id}"
```

**Step 2: Create Service Principal for GitHub**

```bash
# Replace with your values:
SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="your-resource-group"
FUNCTION_APP="fa-dadi"

# Create service principal with contributor role on the Function App
az ad sp create-for-rbac \
  --name "github-deploy-fa-dadi" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FUNCTION_APP" \
  --json-auth

# Copy the entire JSON output
```

**Step 3: Add as GitHub Secret**
- Name: `AZURE_CREDENTIALS`
- Value: The JSON from above

**Step 4: Update workflow** (I'll provide the updated file)

Let me know which approach you want to try:
1. Re-verify the publish profile content
2. Switch to Service Principal authentication
