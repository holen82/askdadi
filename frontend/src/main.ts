/**
 * Main application entry point
 */

import './styles/main.css';
import './styles/login.css';
import './styles/header.css';
import './styles/chat.css';
import './styles/message.css';
import { initAuthGuard } from '@/utils/authGuard';
import { renderHeader, initHeader } from '@/components/Header';
import { renderChat, initChat } from '@/components/Chat';
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
      ${renderChat()}
    </main>
  `;

  // Initialize components
  initHeader();
  initChat();

  console.log('AI Assistant application initialized for user:', user.email);
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
