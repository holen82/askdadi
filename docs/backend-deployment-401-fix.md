# Backend Deployment 401 Error - Troubleshooting

## Error
```
Failed to acquire app settings from https://<scmsite>/api/settings
Unauthorized (CODE: 401)
```

## Cause
The publish profile doesn't match the Function App, or is invalid/expired.

## Solution

### 1. Download Fresh Publish Profile

**Using Azure Portal:**
1. Go to Azure Portal
2. Navigate to your Function App (`fa-dadi`)
3. Click **Overview** (top of left menu)
4. Click **Get publish profile** button (top toolbar)
5. Save the `.PublishSettings` file
6. Open it with a text editor

**Verify the publish profile contains:**
- Should be XML format
- Should have `<publishProfile>` tags
- Should contain `publishUrl` with your function app name
- Should contain `userName` and `userPWD`

**Example structure:**
```xml
<publishData>
  <publishProfile
    profileName="fa-dadi - Web Deploy"
    publishMethod="MSDeploy"
    publishUrl="fa-dadi.scm.azurewebsites.net:443"
    userName="$fa-dadi"
    userPWD="..."
    ...
  />
</publishData>
```

### 2. Update GitHub Secret

1. Go to GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Find `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
4. Click **Update**
5. Delete old value
6. Paste **entire XML content** from the publish profile file
7. Click **Update secret**

**Important:**
- Copy the **entire file contents** (all XML)
- Include the first line: `<?xml version="1.0" encoding="utf-8"?>`
- No extra spaces or newlines at start/end

### 3. Verify Function App Name Matches

In `.github/workflows/backend-deploy.yml`, verify line 14:
```yaml
AZURE_FUNCTIONAPP_NAME: 'fa-dadi'
```

Should match exactly with:
- Your Function App name in Azure Portal
- The `publishUrl` in publish profile (first part before `.scm`)

### 4. Test Deployment Again

**Option A: Manual trigger**
1. Go to GitHub → **Actions** tab
2. Select "Deploy C# Backend to Azure Function App"
3. Click **Run workflow**
4. Select `master` branch
5. Click **Run workflow**

**Option B: Push a change**
```bash
cd backend-csharp
# Make a small change
echo "// Test" >> README.md
git add .
git commit -m "Test backend deployment"
git push
```

## Common Issues

### Issue: "Downloaded wrong publish profile"
- **Symptom**: 401 error persists
- **Solution**: Make sure you downloaded from the correct Function App
- **Verify**: Check function app name in Azure Portal URL

### Issue: "Copied partial XML"
- **Symptom**: Error parsing publish profile
- **Solution**: Copy entire XML including `<?xml` declaration
- **Verify**: Check first and last lines are complete

### Issue: "Function App name mismatch"
- **Symptom**: 401 or "Function App not found"
- **Solution**: Update workflow AZURE_FUNCTIONAPP_NAME to match exactly
- **Verify**: Compare with Azure Portal resource name

### Issue: "Publish profile expired"
- **Symptom**: Was working before, now 401
- **Solution**: Regenerate publish profile in Azure Portal
- **Steps**: Function App → Deployment Center → Manage publish profile → Download

## Alternative: Use Service Principal

If publish profile continues to fail, you can use Service Principal authentication:

### 1. Create Service Principal
```bash
az ad sp create-for-rbac \
  --name "github-deploy-dadi" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.Web/sites/{app-name} \
  --sdk-auth
```

### 2. Add as GitHub Secret
- Name: `AZURE_CREDENTIALS`
- Value: JSON output from above command

### 3. Update Workflow
Replace the deploy step with:
```yaml
- name: Azure Login
  uses: azure/login@v2
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Deploy to Function App
  uses: Azure/functions-action@v1
  with:
    app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
    package: '${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}/output'
```

## Verification Checklist

- [ ] Downloaded fresh publish profile from correct Function App
- [ ] Copied entire XML content (including `<?xml` line)
- [ ] Updated GitHub secret with complete XML
- [ ] Function App name in workflow matches Azure resource
- [ ] No extra whitespace in secret value
- [ ] Function App is running (not stopped)
- [ ] Re-triggered deployment after updating secret

## Still Having Issues?

Check Application Insights or Function App logs:
```bash
az webapp log tail --name fa-dadi --resource-group <your-rg>
```

Or verify deployment credentials:
```bash
az functionapp deployment list-publishing-credentials \
  --name fa-dadi \
  --resource-group <your-rg>
```
