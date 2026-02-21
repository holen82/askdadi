import type { Message } from '@/types/chat';

export function renderMessage(message: Message): string {
  const isUser = message.role === 'user';
  const avatarText = isUser ? 'Du' : 'AI';
  const labelText = isUser ? 'Jeg' : 'Dad-I';
  const formattedContent = formatContent(message.content);

  return `
    <div class="message message-${message.role}" data-message-id="${message.id}">
      <div class="message-avatar">${avatarText}</div>
      <div class="message-content-wrapper">
        <div class="message-label">${labelText}</div>
        <div class="message-content">${formattedContent}</div>
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
