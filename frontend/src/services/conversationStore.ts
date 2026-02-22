import { openDB } from 'idb';
import type { Message } from '@/types/chat';

const DB_NAME = 'dadi-chat';
const STORE_NAME = 'messages';
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
}

export async function loadMessages(): Promise<Message[]> {
  try {
    const db = await getDb();
    const raw = await db.get(STORE_NAME, 'conversation');
    if (!Array.isArray(raw)) return [];
    // Rehydrate Date objects
    return raw.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch (err) {
    console.warn('Failed to load messages from IndexedDB:', err);
    return [];
  }
}

export async function saveMessages(messages: Message[]): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, messages, 'conversation');
  } catch (err) {
    console.warn('Failed to save messages to IndexedDB:', err);
  }
}

export async function clearMessages(): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, 'conversation');
  } catch (err) {
    console.warn('Failed to clear messages from IndexedDB:', err);
  }
}
