import type { Message, ChatState } from '@/types/chat';
import { renderMessage } from './Message';
import { chatService, type ChatMessage } from '@/services/chatService';

const state: ChatState = {
  messages: [],
  isLoading: false,
  error: null
};

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
            placeholder="Type your message here..."
            rows="2"
            ${state.isLoading ? 'disabled' : ''}
          ></textarea>
          <button
            id="chat-send-button"
            class="chat-send-button"
            ${state.isLoading ? 'disabled' : ''}
          >
            Send
          </button>
        </div>
        ${state.isLoading ? '<div class="chat-loading">AI is thinking...</div>' : ''}
      </div>
    </div>
  `;
}

function renderMessages(): string {
  if (state.messages.length === 0) {
    return `
      <div class="chat-empty-state">
        <h3>Welcome to Dadi AI Assistant</h3>
        <p>Start a conversation by typing a message below.</p>
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

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
  });
}

async function handleSendMessage(): Promise<void> {
  const input = document.getElementById('chat-input') as HTMLTextAreaElement;
  
  if (!input) return;

  const content = input.value.trim();
  
  if (!content || state.isLoading) return;

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
  
  updateUI();

  try {
    state.isLoading = true;
    updateUI();

    // TODO: Call chat service
    const response = await sendMessageToAPI(content);
    
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    state.messages.push(assistantMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    state.error = error instanceof Error ? error.message : 'Failed to send message';
  } finally {
    state.isLoading = false;
    updateUI();
  }
}

async function sendMessageToAPI(message: string): Promise<string> {
  const messages: ChatMessage[] = state.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  messages.push({
    role: 'user',
    content: message
  });

  return await chatService.sendMessage(messages);
}

function updateUI(): void {
  const messagesContainer = document.getElementById('chat-messages');
  const inputContainer = document.querySelector('.chat-input-container');
  
  if (messagesContainer) {
    updateMessagesContainer(messagesContainer);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

    if (state.isLoading && !loadingDiv) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'chat-loading';
      loadingElement.textContent = 'AI is thinking...';
      inputContainer.appendChild(loadingElement);
    } else if (!state.isLoading && loadingDiv) {
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
