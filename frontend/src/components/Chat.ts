import type { Message, ChatState, Conversation } from '@/types/chat';
import { renderMessage } from './Message';
import { chatService, type ChatMessage } from '@/services/chatService';
import { trimMessagesToBudget } from '@/utils/tokenUtils';
import { ConversationStorage } from '@/services/conversationStorage';
import { dispatch, type ToolContext } from '@/tools/toolRegistry';
import { registerIdeaTools } from '@/tools/ideaTool';
registerIdeaTools();

const MAX_INPUT_CHARS = 4000;

const state: ChatState = {
  messages: [],
  isLoading: false,
  error: null
};

let currentConversation: Conversation | null = null;

export function renderChat(): string {
  return `
    <div class="chat-container">
      <div class="chat-messages" id="chat-messages">
        ${renderMessages()}
      </div>
      <div class="chat-input-container">
        ${state.error ? `<div class="chat-error">${escapeHtml(state.error)}</div>` : ''}
        <div class="chat-input-wrapper">
          <textarea
            id="chat-input"
            class="chat-input"
            placeholder="Skriv her..."
            rows="2"
            maxlength="${MAX_INPUT_CHARS}"
            ${state.isLoading ? 'disabled' : ''}
          ></textarea>
          <button
            id="chat-send-button"
            class="chat-send-button"
            ${state.isLoading ? 'disabled' : ''}
            aria-label="Send melding"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"></path>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
            </svg>
          </button>
          <div id="char-counter" class="char-counter">0 / ${MAX_INPUT_CHARS}</div>
        </div>
      </div>
    </div>
  `;
}

function renderMessages(): string {
  if (state.messages.length === 0) {
    return `
      <div class="chat-empty-state">
        <h3>Lurer du på noe? Spør Dad-I</h3>
        <p>Start en samtale ved å skrive en melding nedenfor.</p>
      </div>
    `;
  }

  return state.messages.map(message => renderMessage(message)).join('');
}

function updateMessagesContainer(container: HTMLElement): void {
  if (state.messages.length === 0) {
    container.innerHTML = renderMessages();
    return;
  }

  // Remove empty state if it exists
  const emptyState = container.querySelector('.chat-empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  // Get existing message IDs
  const existingIds = new Set(
    Array.from(container.querySelectorAll('[data-message-id]'))
      .map(el => el.getAttribute('data-message-id'))
  );

  // Only append new messages
  state.messages.forEach(message => {
    if (!existingIds.has(message.id)) {
      const messageHtml = renderMessage(message);
      container.insertAdjacentHTML('beforeend', messageHtml);
    }
  });
}

const COPY_ICON_HTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const CHECK_ICON_HTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

export function initChat(): void {
  const sendButton = document.getElementById('chat-send-button');
  const input = document.getElementById('chat-input') as HTMLTextAreaElement;

  if (!sendButton || !input) {
    console.error('Chat elements not found');
    return;
  }

  sendButton.addEventListener('click', handleSendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Auto-resize textarea + update char counter
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
    updateCharCounter(input.value.trim().length);
  });

  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer) {
    // Desktop: copy button click
    messagesContainer.addEventListener('click', (e) => {
      const btn = (e.target as Element).closest('.message-copy-btn');
      if (!btn) return;
      const messageEl = btn.closest('[data-message-id]');
      if (!messageEl) return;
      const content = messageEl.getAttribute('data-message-content') ?? '';
      copyMessageToClipboard(content, btn as HTMLButtonElement, null);
    });

    // Mobile: long-press to copy whole message
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;

    messagesContainer.addEventListener('touchstart', (e) => {
      const messageEl = (e.target as Element).closest('[data-message-id]');
      if (!messageEl) return;
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        const content = messageEl.getAttribute('data-message-content') ?? '';
        copyMessageToClipboard(content, null, messageEl as HTMLElement);
      }, 600);
    }, { passive: true });

    const cancelLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    messagesContainer.addEventListener('touchend', cancelLongPress, { passive: true });
    messagesContainer.addEventListener('touchmove', cancelLongPress, { passive: true });
  }
}

function copyMessageToClipboard(text: string, btn: HTMLButtonElement | null, messageEl: HTMLElement | null): void {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = CHECK_ICON_HTML;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = original || COPY_ICON_HTML;
        btn.classList.remove('copied');
      }, 2000);
    }
    if (messageEl) {
      messageEl.classList.add('message-long-press-copied');
      setTimeout(() => messageEl.classList.remove('message-long-press-copied'), 700);
    }
    showCopyToast();
  }).catch(() => { /* clipboard unavailable */ });
}

function showCopyToast(): void {
  const existing = document.querySelector('.copy-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = 'Kopiert!';
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('copy-toast--visible'));
  });

  setTimeout(() => {
    toast.classList.remove('copy-toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}

function updateCharCounter(length: number): void {
  const counter = document.getElementById('char-counter');
  if (!counter) return;
  counter.textContent = `${length} / ${MAX_INPUT_CHARS}`;
  counter.classList.remove('char-counter--near-limit', 'char-counter--at-limit');
  if (length >= MAX_INPUT_CHARS) {
    counter.classList.add('char-counter--at-limit');
  } else if (length >= MAX_INPUT_CHARS * 0.85) {
    counter.classList.add('char-counter--near-limit');
  }
}

async function handleSendMessage(): Promise<void> {
  const input = document.getElementById('chat-input') as HTMLTextAreaElement;

  if (!input) return;

  const content = input.value.trim();

  if (!content || state.isLoading) return;

  if (content.length > MAX_INPUT_CHARS) {
    state.error = `Meldingen er for lang. Maks ${MAX_INPUT_CHARS} tegn tillatt.`;
    updateUI();
    return;
  }

  if (content.startsWith('/')) {
    input.value = '';
    input.style.height = 'auto';
    updateCharCounter(0);
    state.error = null;

    const toolContext: ToolContext = {
      addSystemMessage(text: string) {
        state.messages.push({ id: generateId(), role: 'system', content: text, timestamp: new Date() });
        updateUI();
        if (currentConversation) {
          currentConversation.messages = [...state.messages];
          ConversationStorage.saveConversation(currentConversation);
          window.dispatchEvent(new CustomEvent('conversation-updated'));
        }
      },
      setError(msg: string) { state.error = msg; updateUI(); }
    };

    await dispatch(content, toolContext);
    return;
  }

  // Create new conversation if needed
  if (!currentConversation) {
    currentConversation = ConversationStorage.createConversation(content);
    ConversationStorage.setActiveConversation(currentConversation.id);

    // Notify to update sidebar
    window.dispatchEvent(new CustomEvent('conversation-created'));
  }

  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content,
    timestamp: new Date()
  };

  state.messages.push(userMessage);
  state.error = null;
  input.value = '';
  input.style.height = 'auto';
  updateCharCounter(0);

  updateUI();

  // Create assistant message placeholder
  const assistantMessageId = generateId();
  const assistantMessage: Message = {
    id: assistantMessageId,
    role: 'assistant',
    content: '',
    timestamp: new Date()
  };

  state.messages.push(assistantMessage);

  try {
    state.isLoading = true;
    updateUI();

    // Build full history excluding the empty assistant placeholder and system messages, then trim to token budget
    const allMessages: ChatMessage[] = state.messages
      .filter(msg => msg.id !== assistantMessageId && msg.role !== 'system')
      .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));

    const messages = trimMessagesToBudget(allMessages);

    // Stream the response
    let fullContent = '';
    const messageElement = document.querySelector(`[data-message-id="${assistantMessageId}"]`);

    if (messageElement) {
      const contentWrapper = messageElement.querySelector('.message-content');

      if (contentWrapper) {
        contentWrapper.classList.add('streaming');
      }

      for await (const chunk of chatService.streamMessage(messages)) {
        fullContent += chunk;
        assistantMessage.content = fullContent;

        if (contentWrapper) {
          // Update content smoothly without jumping
          const scrollContainer = document.getElementById('chat-messages');
          const wasAtBottom = scrollContainer ?
            Math.abs(scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight) < 50 :
            false;

          contentWrapper.innerHTML = formatContent(fullContent);

          // Only scroll if user was already at bottom
          if (wasAtBottom && scrollContainer) {
            requestAnimationFrame(() => {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            });
          }
        }
      }

      if (contentWrapper) {
        contentWrapper.classList.remove('streaming');
      }

      // Update copyable content now that streaming is complete
      messageElement.setAttribute('data-message-content', fullContent);
    }

    // Save conversation after successful response
    if (currentConversation) {
      currentConversation.messages = [...state.messages];
      ConversationStorage.saveConversation(currentConversation);

      // Notify sidebar to update
      window.dispatchEvent(new CustomEvent('conversation-updated'));
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    state.error = error instanceof Error ? error.message : 'Failed to send message';

    // Remove the failed assistant message
    const index = state.messages.findIndex(msg => msg.id === assistantMessageId);
    if (index !== -1) {
      state.messages.splice(index, 1);
    }
  } finally {
    state.isLoading = false;
    updateUI();

    // Focus the input after response is complete
    const inputEl = document.getElementById('chat-input') as HTMLTextAreaElement;
    if (inputEl) {
      inputEl.focus();
    }
  }
}

function formatContent(content: string): string {
  let formatted = escapeHtml(content);

  // Convert code blocks (```...```)
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Convert inline code (`...`)
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert bold (**...**)
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert italic (*...*)
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

function updateUI(): void {
  const messagesContainer = document.getElementById('chat-messages');
  const inputContainer = document.querySelector('.chat-input-container');

  if (messagesContainer) {
    const wasAtBottom = Math.abs(messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight) < 50;
    updateMessagesContainer(messagesContainer);
    if (wasAtBottom) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  if (inputContainer) {
    const errorDiv = inputContainer.querySelector('.chat-error');
    const loadingDiv = inputContainer.querySelector('.chat-loading');
    const input = document.getElementById('chat-input') as HTMLTextAreaElement;
    const sendButton = document.getElementById('chat-send-button') as HTMLButtonElement;

    if (state.error && !errorDiv) {
      const errorElement = document.createElement('div');
      errorElement.className = 'chat-error';
      errorElement.textContent = state.error;
      inputContainer.insertBefore(errorElement, inputContainer.firstChild);
    } else if (!state.error && errorDiv) {
      errorDiv.remove();
    }

    if (!state.isLoading && loadingDiv) {
      loadingDiv.remove();
    }

    if (input && sendButton) {
      input.disabled = state.isLoading;
      sendButton.disabled = state.isLoading;
    }
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getChatState(): ChatState {
  return { ...state };
}

export function loadConversation(conversationId: string): void {
  const conversation = ConversationStorage.getConversation(conversationId);

  if (conversation) {
    currentConversation = conversation;
    state.messages = [...conversation.messages];
    state.error = null;
    ConversationStorage.setActiveConversation(conversationId);
    updateUI();
  }
}

export function startNewConversation(): void {
  currentConversation = null;
  state.messages = [];
  state.error = null;
  ConversationStorage.clearActiveConversation();
  updateUI();

  const input = document.getElementById('chat-input') as HTMLTextAreaElement;
  if (input) {
    input.focus();
  }
}

export function getCurrentConversationId(): string | null {
  return currentConversation?.id || null;
}

// Initialize conversation from storage on load
export function initConversationFromStorage(): void {
  const activeId = ConversationStorage.getActiveConversationId();
  if (activeId) {
    loadConversation(activeId);
  }
}
