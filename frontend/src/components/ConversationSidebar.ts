import type { ConversationMetadata } from '@/types/chat';

interface ConversationSidebarProps {
  conversations: ConversationMetadata[];
  activeConversationId: string | null;
  isOpen: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClose: () => void;
}

export function renderConversationSidebar(props: ConversationSidebarProps): string {
  const {
    conversations,
    activeConversationId,
    isOpen,
  } = props;

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

  return conversations
    .map(conv => renderConversationItem(conv, conv.id === activeId))
    .join('');
}

function renderConversationItem(conversation: ConversationMetadata, isActive: boolean): string {
  const timeAgo = formatTimeAgo(conversation.timestamp);

  return `
    <div class="conversation-item ${isActive ? 'active' : ''}" data-conversation-id="${conversation.id}">
      <button class="conversation-button" data-action="select" data-id="${conversation.id}">
        <div class="conversation-info">
          <h3 class="conversation-title">${escapeHtml(conversation.title)}</h3>
          <div class="conversation-meta">
            <span class="conversation-time">${timeAgo}</span>
            <span class="conversation-count">${conversation.messageCount} meldinger</span>
          </div>
        </div>
      </button>
      <button class="conversation-delete" data-action="delete" data-id="${conversation.id}" aria-label="Slett samtale">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function initConversationSidebar(
  onSelectConversation: (id: string) => void,
  onNewConversation: () => void,
  onDeleteConversation: (id: string) => void,
  onClose: () => void
): void {
  const sidebar = document.getElementById('conversation-sidebar');
  if (!sidebar) return;

  // Delegate click events
  sidebar.addEventListener('click', (e) => {
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
    } else if (action === 'delete' && id) {
      e.stopPropagation();
      if (confirm('Slett denne samtalen?')) {
        onDeleteConversation(id);
      }
    }
  });
}
