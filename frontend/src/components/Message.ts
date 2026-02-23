import type { Message } from '@/types/chat';

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

export function renderMessage(message: Message): string {
  if (message.role === 'system') {
    return `
    <div class="message message-system" data-message-id="${message.id}" data-message-content="${escapeHtml(message.content)}">
      <div class="message-avatar message-system-avatar">AI</div>
      <div class="message-content-wrapper">
        <div class="message-content message-system-content">${formatContent(message.content)}</div>
        <div class="message-actions">
          <button class="message-copy-btn" aria-label="Kopier melding" title="Kopier">${COPY_ICON}</button>
        </div>
      </div>
    </div>
  `;
  }

  const isUser = message.role === 'user';
  const avatarText = isUser ? 'Du' : 'AI';
  const labelText = isUser ? 'Jeg' : 'Dad-I';
  const formattedContent = formatContent(message.content);

  return `
    <div class="message message-${message.role}" data-message-id="${message.id}" data-message-content="${escapeHtml(message.content)}">
      <div class="message-avatar">${avatarText}</div>
      <div class="message-content-wrapper">
        <div class="message-label">${labelText}</div>
        <div class="message-content">${formattedContent}</div>
        <div class="message-actions">
          <button class="message-copy-btn" aria-label="Kopier melding" title="Kopier">${COPY_ICON}</button>
        </div>
      </div>
    </div>
  `;
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

  return formatted;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
