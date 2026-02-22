export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

export interface ConversationMetadata {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}
