/**
 * Main application entry point
 */

import './styles/main.css';
import './styles/login.css';
import './styles/header.css';
import { initAuthGuard } from '@/utils/authGuard';
import { renderHeader, initHeader } from '@/components/Header';
import type { User } from '@/types/auth';

// Initialize the authenticated application
function initAuthenticatedApp(user: User): void {
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('App element not found');
  }

  // Render main app structure
  appElement.innerHTML = `
    ${renderHeader(user)}
    <main class="app-main">
      <div style="display: flex; justify-content: center; align-items: center; height: 100%; font-family: system-ui;">
        <div style="text-align: center;">
          <h2>Welcome, ${escapeHtml(user.email)}!</h2>
          <p>Chat interface coming soon...</p>
        </div>
      </div>
    </main>
  `;

  // Initialize header interactions
  initHeader();

  console.log('AI Assistant application initialized for user:', user.email);
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialize the application
async function initApp(): Promise<void> {
  await initAuthGuard(initAuthenticatedApp);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
