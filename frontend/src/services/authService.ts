/**
 * Authentication service for handling user login, logout, and validation
 */

import type { User, AuthError } from '@/types/auth';

const API_BASE_URL = '/api';

/**
 * Get current user information from backend
 */
export async function getUserInfo(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
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
      const error: AuthError = await response.json();
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
 */
export function logout(): void {
  window.location.href = '/.auth/logout';
}

/**
 * Redirect to login page
 */
export function redirectToLogin(): void {
  // Use post_login_redirect_uri to redirect back to app after successful login
  window.location.href = '/.auth/login/google?post_login_redirect_uri=/';
}
