/**
 * Authentication guard - manages auth flow on app load
 */

import { getUserInfo } from '@/services/authService';
import { renderLoginScreen, initLoginScreen } from '@/components/LoginScreen';
import type { User } from '@/types/auth';

export async function initAuthGuard(
  onAuthenticated: (user: User) => void
): Promise<void> {
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('App element not found');
  }

  // Show loading state
  appElement.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 16px; color: #6b7280;">Loading...</p>
      </div>
    </div>
  `;

  try {
    const user = await getUserInfo();

    if (user && user.isAuthenticated) {
      onAuthenticated(user);
    } else {
      showLoginScreen(appElement);
    }
  } catch (error) {
    console.error('Auth guard error:', error);
    showLoginScreen(appElement);
  }
}

function showLoginScreen(appElement: HTMLElement): void {
  appElement.innerHTML = renderLoginScreen();
  initLoginScreen();
}
