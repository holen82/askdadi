/**
 * Authentication service for handling user login, logout, and validation
 */

import type { User, AuthError } from '@/types/auth';

/**
 * Get current user information from backend
 */
export async function getUserInfo(): Promise<User | null> {
  try {
    const apiBaseUrl = import.meta.env.VITE_FUNCTION_APP_URL || 'http://localhost:7071';
    
    const response = await fetch(`${apiBaseUrl}/user`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      const error: AuthError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: 'Failed to get user information'
      }));
      console.error('Failed to get user info:', error);
      return null;
    }

    const user: User = await response.json();
    return user;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

/**
 * Logout current user
 * Redirects to Function App's Easy Auth logout endpoint
 */
export function logout(): void {
  const functionAppUrl = import.meta.env.VITE_FUNCTION_APP_URL || 'http://localhost:7071';
  window.location.href = `${functionAppUrl}/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
}

/**
 * Redirect to login page
 * Uses Function App's Easy Auth login endpoint for Google
 */
export function redirectToLogin(): void {
  const functionAppUrl = import.meta.env.VITE_FUNCTION_APP_URL || 'http://localhost:7071';
  const redirectUri = encodeURIComponent(window.location.origin);
  window.location.href = `${functionAppUrl}/.auth/login/google?post_login_redirect_uri=${redirectUri}`;
}
