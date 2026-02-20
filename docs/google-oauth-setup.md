# Google OAuth Setup for Azure Static Web Apps

## Prerequisites
- Azure Static Web App created
- Google Cloud Console access

## Step-by-Step Guide

### 1. Create Google OAuth Application

1. **Go to Google Cloud Console**
   - Navigate to https://console.cloud.google.com/

2. **Create/Select Project**
   - Create a new project or select existing one

3. **Configure OAuth Consent Screen**
   - Go to **APIs & Services > OAuth consent screen**
   - User Type: **External** (or Internal if using Google Workspace)
   - Fill in required fields:
     - App name: `Dadi AI Assistant`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Add `email`, `profile`, `openid` (should be default)
   - Test users: Add your whitelisted email addresses
   - Click **Save and Continue**

4. **Create OAuth Client ID**
   - Go to **APIs & Services > Credentials**
   - Click **+ Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `Dadi SWA`
   - **Authorized redirect URIs**: Add your callback URL
     ```
     https://YOUR-SWA-NAME.azurestaticapps.net/.auth/login/google/callback
     ```
     Replace `YOUR-SWA-NAME` with your actual SWA resource name (e.g., `kind-glacier-05037fd03`)
   - Click **Create**
   - **Copy the Client ID and Client Secret** - you'll need these

### 2. Configure Azure Static Web Apps

#### Option A: Via Azure Portal (Recommended)

1. **Navigate to Static Web App**
   - Go to https://portal.azure.com
   - Find your Static Web App resource

2. **Add Authentication Provider**
   - Go to **Settings > Authentication**
   - Look for the authentication providers section
   - Click **Manage providers** or similar option
   - If using custom authentication, you may need to add via Configuration

3. **Add Google Provider Settings**
   - Go to **Settings > Configuration**
   - Add Application Settings:
     ```
     GOOGLE_CLIENT_ID = <your-google-client-id>
     GOOGLE_CLIENT_SECRET = <your-google-client-secret>
     ```

#### Option B: Via staticwebapp.config.json (Alternative)

If portal configuration is limited, authentication is typically managed through the portal for standard providers like Google.

### 3. Update Frontend Login Link

The login link in your app should direct to:
```
/.auth/login/google
```

This is already configured in the frontend code.

### 4. Test Authentication Flow

1. **Access your application**
   - Navigate to `https://YOUR-SWA-NAME.azurestaticapps.net`

2. **Click "Login with Google"**
   - Should redirect to Google login
   - Select your whitelisted Google account
   - Grant permissions

3. **Verify successful login**
   - Should redirect back to your app
   - Should see your chat interface

### 5. Verify Backend Authorization

After login, check that:
- User information is accessible at `/api/user`
- Only whitelisted emails can access the API
- Chat functionality works with OpenAI

## Troubleshooting

### "Microsoft login appears instead of Google"
- Google provider not configured in Azure SWA
- Check **Settings > Authentication** in Azure Portal
- Verify redirect URI matches exactly (including https://)

### "Redirect URI mismatch" error
- The redirect URI in Google Console must match exactly:
  ```
  https://YOUR-SWA-NAME.azurestaticapps.net/.auth/login/google/callback
  ```
- No trailing slash
- Must be HTTPS
- Must match your actual SWA domain

### "User not authorized" after login
- Email not in `WHITELISTED_EMAILS` environment variable
- Check Configuration in Static Web App
- Ensure no extra spaces in the comma-separated list

### Authentication works but chat doesn't
- Check that OpenAI environment variables are set
- Verify `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_OPENAI_DEPLOYMENT`
- Check backend logs for errors

## Security Notes

- Keep Client Secret secure - don't commit to Git
- Use environment variables for all secrets
- Regularly rotate OAuth credentials
- Monitor authentication logs for suspicious activity
- Keep test users list minimal in Google Console

## Reference Links

- [Azure SWA Authentication Docs](https://learn.microsoft.com/azure/static-web-apps/authentication-authorization)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [SWA Configuration Reference](https://learn.microsoft.com/azure/static-web-apps/configuration)
