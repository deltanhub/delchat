import AsyncStorage from '@react-native-async-storage/async-storage';

const CONVERSATIONS_CACHE_KEY = 'chat-cached-conversations';
const MESSAGES_CACHE_PREFIX = 'chat-cached-messages:';
const PENDING_QUEUE_PREFIX = 'chat-pending-messages:';

export interface CachedConversation {
  id: string;
  conversationKind: string;
  preview?: string | null;
  lastMessagePreview?: string | null;
  updatedAt?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  partnerName: string;
  partnerAvatarUrl: string | null;
  [key: string]: any;
}

export interface CachedMessage {
  id: string;
  body: string;
  senderUserId: string;
  createdAt: string;
  messageKind: string;
  isPending?: boolean;
}

// Conversations Caching
export async function getCachedConversations(): Promise<CachedConversation[]> {
  try {
    const data = await AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('[Cache] Error getting conversations:', e);
    return [];
  }
}

export async function setCachedConversations(convos: CachedConversation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(convos));
  } catch (e) {
    console.error('[Cache] Error setting conversations:', e);
  }
}

// Thread Messages Caching
export async function getCachedMessages(convoId: string): Promise<CachedMessage[]> {
  try {
    const data = await AsyncStorage.getItem(`${MESSAGES_CACHE_PREFIX}${convoId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`[Cache] Error getting messages for ${convoId}:`, e);
    return [];
  }
}

export async function setCachedMessages(convoId: string, messages: CachedMessage[]): Promise<void> {
  try {
    // Cache only the latest 50 messages to save local storage capacity
    const slice = messages.slice(-50);
    await AsyncStorage.setItem(`${MESSAGES_CACHE_PREFIX}${convoId}`, JSON.stringify(slice));
  } catch (e) {
    console.error(`[Cache] Error setting messages for ${convoId}:`, e);
  }
}

// Offline Pending Messages Queue
export async function getPendingQueue(convoId: string): Promise<CachedMessage[]> {
  try {
    const data = await AsyncStorage.getItem(`${PENDING_QUEUE_PREFIX}${convoId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`[Cache] Error getting pending queue for ${convoId}:`, e);
    return [];
  }
}

export async function addPendingMessage(convoId: string, message: CachedMessage): Promise<void> {
  try {
    const queue = await getPendingQueue(convoId);
    queue.push({ ...message, isPending: true });
    await AsyncStorage.setItem(`${PENDING_QUEUE_PREFIX}${convoId}`, JSON.stringify(queue));
  } catch (e) {
    console.error(`[Cache] Error adding pending message for ${convoId}:`, e);
  }
}

export async function removePendingMessage(convoId: string, msgId: string): Promise<void> {
  try {
    const queue = await getPendingQueue(convoId);
    const filtered = queue.filter(m => m.id !== msgId);
    await AsyncStorage.setItem(`${PENDING_QUEUE_PREFIX}${convoId}`, JSON.stringify(filtered));
  } catch (e) {
    console.error(`[Cache] Error removing pending message ${msgId}:`, e);
  }
}

export async function clearPendingQueue(convoId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PENDING_QUEUE_PREFIX}${convoId}`);
  } catch (e) {
    console.error(`[Cache] Error clearing pending queue for ${convoId}:`, e);
  }
}

// Re-export Enterprise Offline Persistence Engine and Sync Coordinator
export { default as OfflineEngine, OutboxItem } from './offline-engine';
export { default as SyncCoordinator, SyncStatus } from './sync-coordinator';

