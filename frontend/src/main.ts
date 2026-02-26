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
import './styles/info-panel.css';
import { initAuthGuard } from '@/utils/authGuard';
import { renderHeader, initHeader } from '@/components/Header';
import { renderChat, initChat, loadConversation, startNewConversation, getCurrentConversationId, initConversationFromStorage } from '@/components/Chat';
import { renderConversationSidebar, initConversationSidebar } from '@/components/ConversationSidebar';
import { renderInfoPanel, initInfoPanel } from '@/components/InfoPanel';
import { ConversationStorage } from '@/services/conversationStorage';
import { SwipeGestureHandler } from '@/utils/swipeGesture';
import { initDebugMode } from '@/utils/debugMode';
import { deviceMode } from '@/utils/deviceMode';
import type { User } from '@/types/auth';

let sidebarOpen = true;
let infoPanelOpen = false;

// Initialize the authenticated application
function initAuthenticatedApp(user: User): void {
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('App element not found');
  }

  // Panels start closed on all devices
  sidebarOpen = false;

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
        onPinConversation: () => {},
        onClose: () => {}
      })}
      ${renderInfoPanel(false)}
      <main class="app-main main-content ${sidebarOpen ? '' : 'sidebar-closed'}">
        ${renderChat()}
      </main>
    </div>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  `;

  // Initialize components
  initHeader(handleToggleSidebar, handleToggleInfoPanel);
  initInfoPanel(handleCloseInfoPanel);
  initChat();
  initConversationFromStorage();
  checkAndResetStaleConversation();

  // Initialize sidebar
  initConversationSidebar(
    handleSelectConversation,
    handleNewConversation,
    handleDeleteConversation,
    handlePinConversation,
    handleCloseSidebar
  );

  // Initialize swipe gesture for mobile
  const mainContent = document.querySelector('.app-main');
  if (mainContent) {
    new SwipeGestureHandler({
      element: mainContent as HTMLElement,
      onSwipeRight: () => {
        if (window.innerWidth <= 768) {
          if (infoPanelOpen) handleCloseInfoPanel();
          else if (!sidebarOpen) handleToggleSidebar();
        }
      },
      onSwipeLeft: () => {
        if (window.innerWidth <= 768) {
          if (sidebarOpen) handleCloseSidebar();
          else if (!infoPanelOpen) handleToggleInfoPanel();
        }
      },
      threshold: 50
    });
  }

  // Backdrop click to close on mobile
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        if (sidebarOpen) handleToggleSidebar();
        else if (infoPanelOpen) handleToggleInfoPanel();
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

function handlePinConversation(id: string): void {
  ConversationStorage.togglePin(id);
  updateSidebar();
}

function handleCloseSidebar(): void {
  if (sidebarOpen) {
    handleToggleSidebar();
  }
}

function handleToggleInfoPanel(): void {
  infoPanelOpen = !infoPanelOpen;

  const infoPanel = document.getElementById('info-panel');
  const mainContent = document.querySelector('.main-content');
  const backdrop = document.getElementById('sidebar-backdrop');

  // If opening info panel, close sidebar first (mutual exclusion)
  if (infoPanelOpen && sidebarOpen) {
    sidebarOpen = false;
    const sidebar = document.getElementById('conversation-sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
      sidebar.classList.add('closed');
    }
  }

  if (infoPanel) {
    if (infoPanelOpen) {
      infoPanel.classList.add('open');
      infoPanel.classList.remove('closed');
    } else {
      infoPanel.classList.remove('open');
      infoPanel.classList.add('closed');
    }
  }

  if (mainContent) {
    if (infoPanelOpen && window.innerWidth > 768) {
      mainContent.classList.remove('sidebar-closed');
    } else if (!infoPanelOpen && !sidebarOpen) {
      mainContent.classList.add('sidebar-closed');
    }
  }

  if (backdrop && window.innerWidth <= 768) {
    if (infoPanelOpen) {
      backdrop.classList.add('visible');
    } else {
      backdrop.classList.remove('visible');
    }
  }
}

function handleCloseInfoPanel(): void {
  if (infoPanelOpen) {
    handleToggleInfoPanel();
  }
}

function handleToggleSidebar(): void {
  sidebarOpen = !sidebarOpen;

  // If opening sidebar, close info panel first (mutual exclusion)
  if (sidebarOpen && infoPanelOpen) {
    infoPanelOpen = false;
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.classList.remove('open');
      infoPanel.classList.add('closed');
    }
  }

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
  // Clean up mobile backdrop when resizing to desktop
  if (window.innerWidth > 768 && (sidebarOpen || infoPanelOpen)) {
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) {
      backdrop.classList.remove('visible');
    }
  }
}

function checkAndResetStaleConversation(): void {
  const activeId = ConversationStorage.getActiveConversationId();
  if (!activeId) return;

  const conversation = ConversationStorage.getConversation(activeId);
  if (!conversation || conversation.messages.length === 0) return;

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const thirtyMinutes = 30 * 60 * 1000;
  if (Date.now() - lastMessage.timestamp.getTime() > thirtyMinutes) {
    startNewConversation();
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
    onPinConversation: () => {},
    onClose: () => {}
  }).replace(/<aside[^>]*>|<\/aside>/g, '');

  // Re-initialize event handlers
  initConversationSidebar(
    handleSelectConversation,
    handleNewConversation,
    handleDeleteConversation,
    handlePinConversation,
    handleCloseSidebar
  );
}

// Set viewport height CSS variable for mobile browsers.
// Only recalculate when the viewport WIDTH changes (orientation change).
// Keyboard open/close changes only the height — we intentionally ignore that
// so the app layout doesn't compress when the soft keyboard appears.
let _lastVhWidth = -1;
function setViewportHeight(): void {
  const currentWidth = window.innerWidth;
  if (currentWidth === _lastVhWidth) return;
  _lastVhWidth = currentWidth;
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Initialize the application
async function initApp(): Promise<void> {
  // Initialize debug mode first to capture all errors
  initDebugMode();

  // Set initial viewport height, then only update on orientation/width changes
  _lastVhWidth = -1; // force first call to set the variable
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    // On orientation change, reset the width tracker so the next resize
    // (which fires with settled dimensions) always updates --vh.
    _lastVhWidth = -1;
  });

  await initAuthGuard(initAuthenticatedApp);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
