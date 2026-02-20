# Configuration Guide

## Azure Configuration

### 1. Configure Azure OpenAI Environment Variables

In your Azure Function App, set the following application settings:

1. Navigate to your Function App in Azure Portal
2. Go to **Settings > Configuration**
3. Add the following Application Settings:

| Name | Value | Description |
|------|-------|-------------|
| `AZURE_OPENAI_ENDPOINT` | `https://YOUR-RESOURCE.openai.azure.com/` | Your Azure OpenAI endpoint |
| `AZURE_OPENAI_KEY` | `your-api-key` | Your Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | `chat` | Name of your deployed model |
| `WHITELISTED_EMAILS` | `user1@example.com,user2@example.com` | Comma-separated allowed emails |
| `NODE_ENV` | `production` | Environment mode |

4. Click **Save** and restart the Function App

### 2. Verify Deployment

The GitHub Actions workflow will automatically deploy your app when you push to the master branch. You can monitor the deployment:

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. View the latest workflow run
4. Verify both frontend and backend deployed successfully

### 3. Test the Application

1. Navigate to your Static Web App URL (e.g., `https://kind-glacier-05037fd03.azurestaticapps.net`)
2. Click "Login with Google"
3. Authenticate with a whitelisted email
4. Try sending a chat message
5. Verify you receive a response from the AI

## Troubleshooting

### "User not authorized" error
- Verify your email is in the `WHITELISTED_EMAILS` environment variable
- Check that the Function App has restarted after configuration changes

### "OpenAI not configured" error
- Verify `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` are set
- Check that the endpoint URL is correct and includes `https://`
- Verify your Azure OpenAI resource has a deployed model

### "Authentication failed" error
- Check that `AZURE_OPENAI_KEY` is correct
- Verify your Azure OpenAI resource is in the correct region
- Ensure your subscription has quota available

### Chat messages don't work
- Open browser DevTools (F12) and check Console for errors
- Verify the API endpoint is `/api/chat` (should be automatic)
- Check Network tab to see if requests are reaching the backend
- View Function App logs in Azure Portal for backend errors

## Local Development

To run the application locally:

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
# Copy local.settings.json.example to local.settings.json and configure
npm start
```

Note: For local development, you'll need to configure CORS and authentication appropriately.

## Security Notes

- Never commit API keys or secrets to the repository
- Use environment variables for all sensitive configuration
- Keep the whitelist updated with only authorized users
- Monitor your Azure OpenAI usage to avoid unexpected costs
- Review Azure Function logs regularly for suspicious activity
