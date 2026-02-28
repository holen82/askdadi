import './styles/main.css';
import './styles/device-mode.css';
import './styles/login.css';
import './styles/header.css';
import './styles/chat.css';
import './styles/message.css';
import './styles/sidebar.css';
import './styles/info-panel.css';
import './styles/confirm-dialog.css';
import { initAuthGuard } from '@/utils/authGuard';
import { renderHeader, initHeader } from '@/components/Header';
import { renderChat, initChat, loadConversation, startNewConversation, getCurrentConversationId, initConversationFromStorage, fillChatInput, triggerSend } from '@/components/Chat';
import { renderConversationSidebar, initConversationSidebar } from '@/components/ConversationSidebar';
import { renderInfoPanel, initInfoPanel } from '@/components/InfoPanel';
import { ConversationStorage } from '@/services/conversationStorage';
import { initDebugMode } from '@/utils/debugMode';
import { deviceMode } from '@/utils/deviceMode';
import type { User } from '@/types/auth';

let sidebarOpen = true;
let infoPanelOpen = false;

// --- Mobile carousel helpers ---

function setMobilePanelClass(panel: 'sidebar' | 'chat' | 'info'): void {
  document.body.classList.remove('mobile-panel-sidebar', 'mobile-panel-chat', 'mobile-panel-info');
  document.body.classList.add(`mobile-panel-${panel}`);
}

function scrollToPanel(panel: 'sidebar' | 'chat' | 'info', instant = false): void {
  const container = document.querySelector('.app-container') as HTMLElement;
  if (!container || window.innerWidth > 768) return;
  const w = window.innerWidth;
  const x = panel === 'sidebar' ? 0 : panel === 'chat' ? w : w * 2;
  if (instant) {
    container.scrollLeft = x;
  } else {
    container.scrollTo({ left: x, behavior: 'smooth' });
  }
}

function initMobileCarousel(): void {
  if (window.innerWidth > 768) return;

  sidebarOpen = false;
  infoPanelOpen = false;
  setMobilePanelClass('chat');

  const container = document.querySelector('.app-container') as HTMLElement;
  if (!container) return;

  // Snap to chat panel after the first layout pass so scrollLeft takes effect
  requestAnimationFrame(() => {
    scrollToPanel('chat', true);
  });

  container.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;
    const x = container.scrollLeft;
    const w = window.innerWidth;
    if (x < w * 0.5) {
      sidebarOpen = true;
      infoPanelOpen = false;
      setMobilePanelClass('sidebar');
    } else if (x < w * 1.5) {
      sidebarOpen = false;
      infoPanelOpen = false;
      setMobilePanelClass('chat');
    } else {
      sidebarOpen = false;
      infoPanelOpen = true;
      setMobilePanelClass('info');
    }
  }, { passive: true });
}

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
  initInfoPanel(handleCloseInfoPanel, (toolName, requiresInput) => {
    handleCloseInfoPanel();
    if (requiresInput) {
      fillChatInput(`/${toolName} `);
    } else {
      triggerSend(`/${toolName}`);
    }
  });
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

  // Initialize mobile carousel (replaces swipe gesture handlers)
  initMobileCarousel();

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

  // Scroll to chat panel on mobile after selection
  if (window.innerWidth <= 768) {
    scrollToPanel('chat');
  }
}

function handleNewConversation(): void {
  startNewConversation();
  updateSidebar();

  // Scroll to chat panel on mobile after action
  if (window.innerWidth <= 768) {
    scrollToPanel('chat');
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
  if (window.innerWidth <= 768) {
    scrollToPanel('chat');
    return;
  }
  if (sidebarOpen) {
    handleToggleSidebar();
  }
}

function handleToggleInfoPanel(): void {
  if (window.innerWidth <= 768) {
    scrollToPanel(infoPanelOpen ? 'chat' : 'info');
    return;
  }

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
  if (window.innerWidth <= 768) {
    scrollToPanel('chat');
    return;
  }
  if (infoPanelOpen) {
    handleToggleInfoPanel();
  }
}

function handleToggleSidebar(): void {
  if (window.innerWidth <= 768) {
    scrollToPanel(sidebarOpen ? 'chat' : 'sidebar');
    return;
  }

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
  if (window.innerWidth <= 768) {
    // Re-snap to the correct panel after orientation change
    const panel: 'sidebar' | 'chat' | 'info' = infoPanelOpen ? 'info' : sidebarOpen ? 'sidebar' : 'chat';
    scrollToPanel(panel, true);
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

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
