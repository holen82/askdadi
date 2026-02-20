import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractUserFromHeaders, getUserEmail, isWhitelisted } from '../shared/auth.js';

/**
 * Azure Function for role assignment after authentication
 * This endpoint is called by Azure Static Web Apps after a user authenticates
 * to determine what roles the user should have
 */
async function rolesFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Roles assignment request received');

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const user = extractUserFromHeaders(headers);
  
  if (!user) {
    context.log('No user found in request headers');
    return {
      status: 200,
      jsonBody: {
        roles: []
      }
    };
  }

  const email = getUserEmail(user);
  context.log('Checking roles for user:', email);
  
  // Check if user is whitelisted
  if (!isWhitelisted(email)) {
    context.log('User not whitelisted:', email);
    return {
      status: 200,
      jsonBody: {
        roles: []
      }
    };
  }

  // User is whitelisted - assign authenticated role
  context.log('User whitelisted, assigning authenticated role:', email);
  
  return {
    status: 200,
    jsonBody: {
      roles: ['authenticated']
    }
  };
}

app.http('roles', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: rolesFunction
});
