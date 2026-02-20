/**
 * Header component with logout button
 */

import { logout } from '@/services/authService';
import type { User } from '@/types/auth';

export function renderHeader(user: User): string {
  return `
    <header class="app-header">
      <h1 class="app-title">AI Assistant</h1>
      <div class="user-menu">
        <span class="user-email">${escapeHtml(user.email)}</span>
        <button id="logout-button" class="logout-button">Logout</button>
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
  if (confirm('Are you sure you want to logout?')) {
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
