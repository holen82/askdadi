import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractUserFromHeaders, getUserEmail, isWhitelisted } from '../shared/auth.js';

/**
 * Azure Function to validate and return user information
 */
async function userFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('User info request received');

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const user = extractUserFromHeaders(headers);
  
  if (!user) {
    context.log('No user found in request headers');
    return {
      status: 401,
      jsonBody: {
        error: 'Unauthorized',
        message: 'User not authenticated'
      }
    };
  }

  const email = getUserEmail(user);
  
  if (!isWhitelisted(email)) {
    context.log('User not whitelisted:', email);
    return {
      status: 403,
      jsonBody: {
        error: 'Forbidden',
        message: 'User not authorized to access this application'
      }
    };
  }

  context.log('User authenticated successfully:', email);

  return {
    status: 200,
    jsonBody: {
      email,
      provider: user.identityProvider,
      userId: user.userId,
      isAuthenticated: true
    }
  };
}

app.http('user', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: userFunction
});
