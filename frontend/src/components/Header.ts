/**
 * Header component with logout button
 */

import { logout } from '@/services/authService';
import { deviceMode, modeClasses } from '@/utils/deviceMode';
import type { User } from '@/types/auth';

export function renderHeader(user: User): string {
  return `
    <header class="app-header">
      <div class="header-left">
        <button id="menu-button" class="${modeClasses({ base: 'menu-button', mobile: 'menu-button-mobile' })}" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="menu-dropdown" id="menu-dropdown">
          <button class="menu-item" id="conversations-menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Samtaler
          </button>
        </div>
        <h1 class="app-title">${deviceMode.select({ mobile: 'Dad-I', pc: 'Dad Intelligence' })}</h1>
      </div>
      <div class="${modeClasses({ base: 'user-menu', pc: 'user-menu-expanded' })}">
        <span class="${deviceMode.pcClass('user-email')}">${escapeHtml(user.email)}</span>
        <button id="logout-button" class="${modeClasses({ base: 'logout-button', mobile: 'logout-compact' })}">
          ${deviceMode.render({ mobile: '⎋', pc: 'Logg ut' })}
        </button>
      </div>
    </header>
  `;
}

export function initHeader(onToggleSidebar?: () => void): void {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  const menuButton = document.getElementById('menu-button');
  const menuDropdown = document.getElementById('menu-dropdown');
  const conversationsMenuItem = document.getElementById('conversations-menu-item');

  if (menuButton && menuDropdown) {
    // Toggle menu dropdown
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('visible');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuButton.contains(e.target as Node) && !menuDropdown.contains(e.target as Node)) {
        menuDropdown.classList.remove('visible');
      }
    });

    // Handle menu item click
    if (conversationsMenuItem && onToggleSidebar) {
      conversationsMenuItem.addEventListener('click', () => {
        menuDropdown.classList.remove('visible');
        onToggleSidebar();
      });
    }
  }
}

function handleLogout(): void {
  if (confirm('Er du sikker på at du vil logge ut?')) {
    logout();
  }
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
