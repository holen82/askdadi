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
}

export const chatService = new ChatService();
