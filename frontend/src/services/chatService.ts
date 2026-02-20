import { getApiBaseUrl } from '@/utils/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export interface ChatError {
  error: string;
  message: string;
}

class ChatService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: bypassAuth ? 'omit' : 'include',
        body: JSON.stringify({ messages } as ChatRequest),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('You are not authorized to use this application.');
      }

      if (!response.ok) {
        const errorData: ChatError = await response.json().catch(() => ({
          error: 'Unknown Error',
          message: `Request failed with status ${response.status}`
        }));
        throw new Error(errorData.message || errorData.error);
      }

      const data: ChatResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.message;
    } catch (error) {
      console.error('Chat service error:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  async *streamMessage(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    try {
      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        credentials: bypassAuth ? 'omit' : 'include',
        body: JSON.stringify({ messages } as ChatRequest),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('You are not authorized to use this application.');
      }

      if (!response.ok) {
        const errorData: ChatError = await response.json().catch(() => ({
          error: 'Unknown Error',
          message: `Request failed with status ${response.status}`
        }));
        throw new Error(errorData.message || errorData.error);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.chunk) {
                yield parsed.chunk;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', data, e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat stream error:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }
}

export const chatService = new ChatService();
