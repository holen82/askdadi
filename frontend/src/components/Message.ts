import type { Message } from '@/types/chat';

export function renderMessage(message: Message): string {
  const isUser = message.role === 'user';
  const avatarText = isUser ? 'U' : 'AI';
  const formattedTime = formatTimestamp(message.timestamp);
  const formattedContent = formatContent(message.content);

  return `
    <div class="message message-${message.role}" data-message-id="${message.id}">
      <div class="message-avatar">${avatarText}</div>
      <div class="message-content-wrapper">
        <div class="message-content">${formattedContent}</div>
        <div class="message-timestamp">${formattedTime}</div>
      </div>
    </div>
  `;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
