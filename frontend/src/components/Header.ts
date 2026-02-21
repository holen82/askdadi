/**
 * Header component with logout button
 */

import { logout } from '@/services/authService';
import { deviceMode, modeClasses } from '@/utils/deviceMode';
import type { User } from '@/types/auth';

export function renderHeader(user: User): string {
  return `
    <header class="app-header">
      <h1 class="app-title">${deviceMode.select({ mobile: 'Dad-I', pc: 'Dad Intelligence' })}</h1>
      <div class="${modeClasses({ base: 'user-menu', pc: 'user-menu-expanded' })}">
        <span class="${deviceMode.pcClass('user-email')}">${escapeHtml(user.email)}</span>
        <button id="logout-button" class="${modeClasses({ base: 'logout-button', mobile: 'logout-compact' })}">
          ${deviceMode.render({ mobile: '⎋', pc: 'Logg ut' })}
        </button>
      </div>
    </header>
  `;
}

export function initHeader(): void {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
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
