/**
 * Main application entry point
 */

import './styles/main.css';
import './styles/device-mode.css';
import './styles/login.css';
import './styles/header.css';
import './styles/chat.css';
import './styles/message.css';
import { initAuthGuard } from '@/utils/authGuard';
import { renderHeader, initHeader } from '@/components/Header';
import { renderChat, initChat } from '@/components/Chat';
import { initDebugMode } from '@/utils/debugMode';
import { deviceMode } from '@/utils/deviceMode';
import type { User } from '@/types/auth';

// Initialize the authenticated application
async function initAuthenticatedApp(user: User): Promise<void> {
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
  await initChat();

  console.log('AI Assistant application initialized for user:', user.email);
  console.log('Device mode:', deviceMode.getMode());
}

// Set viewport height CSS variable for mobile browsers
function setViewportHeight(): void {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Initialize the application
async function initApp(): Promise<void> {
  // Initialize debug mode first to capture all errors
  initDebugMode();
  
  // Set viewport height for mobile browsers
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
  
  await initAuthGuard(initAuthenticatedApp);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
