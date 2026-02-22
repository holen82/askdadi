/**
 * Main application entry point
 */

import './styles/main.css';
import './styles/device-mode.css';
import './styles/login.css';
import './styles/header.css';
import './styles/chat.css';
import './styles/message.css';
import './styles/sidebar.css';
import { initAuthGuard } from '@/utils/authGuard';
import { renderHeader, initHeader } from '@/components/Header';
import { renderChat, initChat, loadConversation, startNewConversation, getCurrentConversationId, initConversationFromStorage } from '@/components/Chat';
import { renderConversationSidebar, initConversationSidebar } from '@/components/ConversationSidebar';
import { ConversationStorage } from '@/services/conversationStorage';
import { SwipeGestureHandler } from '@/utils/swipeGesture';
import { initDebugMode } from '@/utils/debugMode';
import { deviceMode } from '@/utils/deviceMode';
import type { User } from '@/types/auth';

let sidebarOpen = true;

// Initialize the authenticated application
function initAuthenticatedApp(user: User): void {
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('App element not found');
  }

  // Set initial sidebar state based on device
  sidebarOpen = window.innerWidth > 768;

  // Render main app structure
  appElement.innerHTML = `
    ${renderHeader(user)}
    <div class="app-container">
      ${renderConversationSidebar({
        conversations: ConversationStorage.getAllMetadata(),
        activeConversationId: ConversationStorage.getActiveConversationId(),
        isOpen: sidebarOpen,
        onSelectConversation: () => {},
        onNewConversation: () => {},
        onDeleteConversation: () => {},
        onClose: () => {}
      })}
      <main class="app-main main-content ${sidebarOpen ? '' : 'sidebar-closed'}">
        ${renderChat()}
      </main>
    </div>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  `;

  // Initialize components
  initHeader(handleToggleSidebar);
  initChat();
  initConversationFromStorage();

  // Initialize sidebar
  initConversationSidebar(
    handleSelectConversation,
    handleNewConversation,
    handleDeleteConversation,
    handleCloseSidebar
  );

  // Initialize swipe gesture for mobile
  const mainContent = document.querySelector('.app-main');
  if (mainContent) {
    new SwipeGestureHandler({
      element: mainContent as HTMLElement,
      onSwipeRight: () => {
        if (window.innerWidth <= 768 && !sidebarOpen) {
          handleToggleSidebar();
        }
      },
      onSwipeLeft: () => {
        if (window.innerWidth <= 768 && sidebarOpen) {
          handleToggleSidebar();
        }
      },
      threshold: 50
    });
  }

  // Backdrop click to close on mobile
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      if (window.innerWidth <= 768 && sidebarOpen) {
        handleToggleSidebar();
      }
    });
  }

  // Listen for conversation updates
  window.addEventListener('conversation-created', updateSidebar);
  window.addEventListener('conversation-updated', updateSidebar);

  // Handle window resize
  window.addEventListener('resize', handleWindowResize);

  console.log('AI Assistant application initialized for user:', user.email);
  console.log('Device mode:', deviceMode.getMode());
}

function handleSelectConversation(id: string): void {
  loadConversation(id);
  updateSidebar();

  // Close sidebar on mobile after selection
  if (window.innerWidth <= 768) {
    handleToggleSidebar();
  }
}

function handleNewConversation(): void {
  startNewConversation();
  updateSidebar();

  // Close sidebar on mobile after action
  if (window.innerWidth <= 768) {
    handleToggleSidebar();
  }
}

function handleDeleteConversation(id: string): void {
  ConversationStorage.deleteConversation(id);

  // If deleted conversation was active, start new
  if (getCurrentConversationId() === id) {
    startNewConversation();
  }

  updateSidebar();
}

function handleCloseSidebar(): void {
  if (sidebarOpen) {
    handleToggleSidebar();
  }
}

function handleToggleSidebar(): void {
  sidebarOpen = !sidebarOpen;

  const sidebar = document.getElementById('conversation-sidebar');
  const mainContent = document.querySelector('.main-content');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (sidebar) {
    if (sidebarOpen) {
      sidebar.classList.add('open');
      sidebar.classList.remove('closed');
    } else {
      sidebar.classList.remove('open');
      sidebar.classList.add('closed');
    }
  }

  if (mainContent) {
    if (sidebarOpen && window.innerWidth > 768) {
      mainContent.classList.remove('sidebar-closed');
    } else {
      mainContent.classList.add('sidebar-closed');
    }
  }

  // Handle backdrop on mobile
  if (backdrop && window.innerWidth <= 768) {
    if (sidebarOpen) {
      backdrop.classList.add('visible');
    } else {
      backdrop.classList.remove('visible');
    }
  }
}

function handleWindowResize(): void {
  const wasMobile = sidebarOpen && window.innerWidth <= 768;
  const isDesktop = window.innerWidth > 768;

  if (isDesktop && !sidebarOpen) {
    // Desktop should show sidebar by default
    sidebarOpen = true;
    handleToggleSidebar();
  } else if (wasMobile) {
    // Close sidebar when resizing to desktop from mobile
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) {
      backdrop.classList.remove('visible');
    }
  }
}

function updateSidebar(): void {
  const sidebar = document.getElementById('conversation-sidebar');
  if (!sidebar) return;

  const conversations = ConversationStorage.getAllMetadata();
  const activeId = getCurrentConversationId();

  // Re-render sidebar content
  sidebar.innerHTML = renderConversationSidebar({
    conversations,
    activeConversationId: activeId,
    isOpen: sidebarOpen,
    onSelectConversation: () => {},
    onNewConversation: () => {},
    onDeleteConversation: () => {},
    onClose: () => {}
  }).replace(/<aside[^>]*>|<\/aside>/g, '');

  // Re-initialize event handlers
  initConversationSidebar(
    handleSelectConversation,
    handleNewConversation,
    handleDeleteConversation,
    handleCloseSidebar
  );
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
