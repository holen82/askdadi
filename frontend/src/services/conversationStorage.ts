import type { Conversation, ConversationMetadata } from '@/types/chat';

const STORAGE_KEY = 'dadi_conversations';
const METADATA_KEY = 'dadi_conversations_metadata';
const ACTIVE_KEY = 'dadi_active_conversation';

export class ConversationStorage {
  private static generateTitle(firstMessage: string): string {
    const cleaned = firstMessage.trim();
    if (cleaned.length <= 50) return cleaned;
    return cleaned.substring(0, 47) + '...';
  }

  static createConversation(firstUserMessage?: string): Conversation {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const title = firstUserMessage 
      ? this.generateTitle(firstUserMessage)
      : 'New Conversation';
    
    return {
      id,
      title,
      timestamp: new Date(),
      messages: []
    };
  }

  static saveConversation(conversation: Conversation): void {
    try {
      const conversations = this.getAllConversations();
      const index = conversations.findIndex(c => c.id === conversation.id);
      
      if (index >= 0) {
        conversations[index] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      this.updateMetadata(conversation);
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw new Error('Failed to save conversation. Storage might be full.');
    }
  }

  static getConversation(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    const conversation = conversations.find(c => c.id === id);
    
    if (conversation) {
      // Parse dates back from JSON strings
      conversation.timestamp = new Date(conversation.timestamp);
      conversation.messages = conversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    
    return conversation || null;
  }

  static getAllConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const conversations = JSON.parse(data) as Conversation[];
      return conversations.map(conv => ({
        ...conv,
        timestamp: new Date(conv.timestamp),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  static getAllMetadata(): ConversationMetadata[] {
    try {
      const data = localStorage.getItem(METADATA_KEY);
      if (!data) {
        // Build metadata from conversations if not cached
        return this.rebuildMetadata();
      }
      
      const metadata = JSON.parse(data) as ConversationMetadata[];
      return metadata
        .map(meta => ({
          ...meta,
          timestamp: new Date(meta.timestamp)
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to load conversation metadata:', error);
      return [];
    }
  }

  static deleteConversation(id: string): void {
    try {
      const conversations = this.getAllConversations();
      const filtered = conversations.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      // Also remove from metadata
      const metadata = this.getAllMetadata();
      const filteredMetadata = metadata.filter(m => m.id !== id);
      localStorage.setItem(METADATA_KEY, JSON.stringify(filteredMetadata));
      
      // Clear active if it was the deleted one
      if (this.getActiveConversationId() === id) {
        this.clearActiveConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  static setActiveConversation(id: string): void {
    localStorage.setItem(ACTIVE_KEY, id);
  }

  static getActiveConversationId(): string | null {
    return localStorage.getItem(ACTIVE_KEY);
  }

  static clearActiveConversation(): void {
    localStorage.removeItem(ACTIVE_KEY);
  }

  private static updateMetadata(conversation: Conversation): void {
    try {
      const metadata = this.getAllMetadata();
      const index = metadata.findIndex(m => m.id === conversation.id);
      
      const meta: ConversationMetadata = {
        id: conversation.id,
        title: conversation.title,
        timestamp: conversation.timestamp,
        messageCount: conversation.messages.length
      };
      
      if (index >= 0) {
        metadata[index] = meta;
      } else {
        metadata.push(meta);
      }
      
      localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }

  private static rebuildMetadata(): ConversationMetadata[] {
    const conversations = this.getAllConversations();
    const metadata = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      timestamp: conv.timestamp,
      messageCount: conv.messages.length
    }));
    
    try {
      localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to cache metadata:', error);
    }
    
    return metadata.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(METADATA_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }
}
