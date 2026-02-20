/**
 * Authentication utilities for user validation
 */

export interface User {
  userId: string;
  identityProvider: string;
  userDetails: string;
  userRoles: string[];
}

/**
 * Check if an email is whitelisted
 */
export function isWhitelisted(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const whitelistedEmails = process.env.WHITELISTED_EMAILS || '';
  if (!whitelistedEmails) {
    console.warn('WHITELISTED_EMAILS environment variable is not set');
    return false;
  }

  const allowedEmails = whitelistedEmails
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  return allowedEmails.includes(email.toLowerCase());
}

/**
 * Extract user from Azure Static Web Apps headers
 */
export function extractUserFromHeaders(headers: Record<string, string>): User | null {
  const userHeader = headers['x-ms-client-principal'];
  
  if (!userHeader) {
    return null;
  }

  try {
    const decodedUser = Buffer.from(userHeader, 'base64').toString('utf-8');
    const user = JSON.parse(decodedUser);
    return user;
  } catch (error) {
    console.error('Failed to parse user header:', error);
    return null;
  }
}

/**
 * Get user email from user object
 */
export function getUserEmail(user: User | null): string | null {
  if (!user) {
    return null;
  }

  try {
    const claims = user.userDetails ? JSON.parse(user.userDetails) : null;
    return claims?.email || user.userId || null;
  } catch {
    return user.userId || null;
  }
}
