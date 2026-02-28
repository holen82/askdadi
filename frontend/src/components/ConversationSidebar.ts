import type { ConversationMetadata } from '@/types/chat';
import { confirmDialog } from '@/components/ConfirmDialog';

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02
                   12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`;

const DELETE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"></polyline>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
</svg>`;

interface ConversationSidebarProps {
  conversations: ConversationMetadata[];
  activeConversationId: string | null;
  isOpen: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string) => void;
  onClose: () => void;
}

export function renderConversationSidebar(props: ConversationSidebarProps): string {
  const { conversations, activeConversationId, isOpen } = props;

  return `
    <aside class="conversation-sidebar ${isOpen ? 'open' : 'closed'}" id="conversation-sidebar">
      <div class="sidebar-header">
        <h2>Samtaler</h2>
        <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Lukk sidepanel">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <button class="new-conversation-btn" id="new-conversation-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Ny chat
      </button>

      <div class="conversation-list" id="conversation-list">
        ${renderConversationList(conversations, activeConversationId)}
      </div>
    </aside>
  `;
}

function renderConversationList(conversations: ConversationMetadata[], activeId: string | null): string {
  if (conversations.length === 0) {
    return `
      <div class="conversation-list-empty">
        <p>Ingen samtaler ennå</p>
        <p class="empty-hint">Start en ny chat for å begynne</p>
      </div>
    `;
  }

  const pinned = conversations.filter(c => c.pinned);
  const unpinned = conversations.filter(c => !c.pinned);
  const showHeaders = pinned.length > 0 && unpinned.length > 0;

  const pinnedHtml = pinned.length > 0
    ? (showHeaders ? `<div class="sidebar-section-header">Festet</div>` : '')
      + pinned.map(conv => renderConversationItem(conv, conv.id === activeId)).join('')
    : '';

  const unpinnedHtml = unpinned.length > 0
    ? (showHeaders ? `<div class="sidebar-section-header">Siste samtaler</div>` : '')
      + unpinned.map(conv => renderConversationItem(conv, conv.id === activeId)).join('')
    : '';

  return pinnedHtml + unpinnedHtml;
}

function renderConversationItem(conversation: ConversationMetadata, isActive: boolean): string {
  const timeAgo = formatTimeAgo(conversation.timestamp);
  const isPinned = !!conversation.pinned;

  return `
    <div class="conversation-item ${isActive ? 'active' : ''}"
         data-conversation-id="${conversation.id}"
         data-pinned="${isPinned}">
      <button class="conversation-button" data-action="select" data-id="${conversation.id}">
        <div class="conversation-info">
          <h3 class="conversation-title">${escapeHtml(conversation.title)}</h3>
          <div class="conversation-meta">
            <span class="conversation-time">${timeAgo}</span>
            <span class="conversation-count">${conversation.messageCount} meldinger</span>
            ${isPinned ? `<span class="conversation-pinned-indicator" aria-hidden="true">★</span>` : ''}
          </div>
        </div>
      </button>
    </div>
  `;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Akkurat nå';
  if (diffMins < 60) return `${diffMins}m siden`;
  if (diffHours < 24) return `${diffHours}t siden`;
  if (diffDays < 7) return `${diffDays}d siden`;

  return date.toLocaleDateString('no-NO', { month: 'short', day: 'numeric' });
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function initConversationSidebar(
  onSelectConversation: (id: string) => void,
  onNewConversation: () => void,
  onDeleteConversation: (id: string) => void,
  onPinConversation: (id: string) => void,
  onClose: () => void
): void {
  const sidebar = document.getElementById('conversation-sidebar');
  if (!sidebar) return;

  let longPressTimer: number | null = null;
  let touchMoved = false;
  let suppressNextClick = false;

  function getConvItem(target: EventTarget | null): { id: string; isPinned: boolean } | null {
    const el = (target as HTMLElement).closest('[data-conversation-id]') as HTMLElement | null;
    if (!el) return null;
    const id = el.dataset.conversationId;
    const isPinned = el.dataset.pinned === 'true';
    return id ? { id, isPinned } : null;
  }

  function openContextMenu(id: string, isPinned: boolean, x: number, y: number): void {
    document.getElementById('conv-context-menu')?.remove();

    const menu = document.createElement('div');
    menu.id = 'conv-context-menu';
    menu.className = 'conversation-context-menu';
    menu.innerHTML = `
      <button class="context-menu-item" data-menu-action="pin" data-id="${id}">
        ${PIN_SVG}
        ${isPinned ? 'Løsne samtale' : 'Fest samtale'}
      </button>
      <button class="context-menu-item context-menu-delete" data-menu-action="delete" data-id="${id}">
        ${DELETE_SVG}
        Slett samtale
      </button>
    `;

    document.body.appendChild(menu);

    const menuWidth = 180;
    const menuHeight = 96;
    let left = x;
    let top = y;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    if (top + menuHeight > window.innerHeight - 8) top = y - menuHeight;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    menu.addEventListener('click', async (e) => {
      const btn = (e.target as HTMLElement).closest('[data-menu-action]') as HTMLElement | null;
      if (!btn) return;
      menu.remove();
      const menuId = btn.dataset.id!;
      if (btn.dataset.menuAction === 'pin') {
        onPinConversation(menuId);
      } else if (btn.dataset.menuAction === 'delete') {
        const confirmed = await confirmDialog({
          title: 'Slett samtale',
          message: 'Er du sikker på at du vil slette denne samtalen? Dette kan ikke angres.',
          confirmText: 'Slett',
          cancelText: 'Avbryt',
          destructive: true
        });
        if (confirmed) onDeleteConversation(menuId);
      }
    });

    const dismiss = (e: Event) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', dismiss, true);
        document.removeEventListener('touchstart', dismiss, true);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', dismiss, true);
      document.addEventListener('touchstart', dismiss, true);
    }, 0);
  }

  function cancelLongPress(): void {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  sidebar.addEventListener('touchstart', (e) => {
    const conv = getConvItem(e.target);
    if (!conv) return;
    touchMoved = false;
    const { clientX, clientY } = e.touches[0];
    longPressTimer = window.setTimeout(() => {
      if (!touchMoved) {
        suppressNextClick = true;
        openContextMenu(conv.id, conv.isPinned, clientX, clientY);
      }
    }, 500);
  }, { passive: true });

  sidebar.addEventListener('touchmove', () => {
    touchMoved = true;
    cancelLongPress();
  }, { passive: true });

  sidebar.addEventListener('touchend', cancelLongPress, { passive: true });
  sidebar.addEventListener('touchcancel', cancelLongPress, { passive: true });

  sidebar.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const conv = getConvItem(e.target);
    if (!conv) return;
    const { clientX, clientY } = e;
    longPressTimer = window.setTimeout(() => {
      suppressNextClick = true;
      openContextMenu(conv.id, conv.isPinned, clientX, clientY);
    }, 500);
  });

  sidebar.addEventListener('mouseup', cancelLongPress);
  sidebar.addEventListener('mouseleave', cancelLongPress);

  sidebar.addEventListener('contextmenu', (e) => {
    const conv = getConvItem(e.target);
    if (!conv) return;
    e.preventDefault();
    cancelLongPress();
    openContextMenu(conv.id, conv.isPinned, e.clientX, e.clientY);
  });

  sidebar.addEventListener('click', (e) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    const target = e.target as HTMLElement;
    const button = target.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');

    if (button.id === 'sidebar-close-btn') {
      onClose();
    } else if (button.id === 'new-conversation-btn') {
      onNewConversation();
    } else if (action === 'select' && id) {
      onSelectConversation(id);
    }
  });
}
