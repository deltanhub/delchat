import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../components/chat/MessageBubble';
import type { ChatConversation } from '../components/chat/ConversationRow';

const CONVERSATIONS_STORAGE_KEY = '@delchat_offline_conversations';
const MESSAGES_PREFIX = '@delchat_offline_msgs:';
const OUTBOX_STORAGE_KEY = '@delchat_offline_outbox';
const MAX_CACHED_MESSAGES_PER_THREAD = 300;

export interface OutboxItem {
  id: string; // Temporary ID (e.g. optimistic-1725...)
  conversationId: string;
  senderUserId: string;
  messageKind:
    | 'text'
    | 'voice_note'
    | 'attachments'
    | 'inquiry_form'
    | 'inquiry_response'
    | 'listing_card';
  body: string;
  intent?: string | null;
  structuredPayload?: any;
  // Local media payload if pending upload
  localMediaUri?: string;
  mediaKind?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  mimeType?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  createdAt: string;
  retryCount: number;
  error?: string | null;
}

// In-memory hot cache for instant 0ms latency rendering
const _memoryMessageCache = new Map<string, ChatMessage[]>();
let _memoryConversationsCache: ChatConversation[] | null = null;
let _memoryOutbox: OutboxItem[] | null = null;

export const OfflineEngine = {
  // -------------------------------------------------------------
  // 1. Thread Messages Persistence
  // -------------------------------------------------------------

  /**
   * Synchronously get cached messages from in-memory hot cache for instant 0ms Frame 1 rendering.
   */
  getMessagesSync(conversationId: string): ChatMessage[] {
    if (!conversationId) return [];
    return _memoryMessageCache.get(conversationId) || [];
  },

  /**
   * Synchronously update in-memory hot cache with a single message (0ms latency)
   * and persist asynchronously to storage.
   */
  saveSingleMessage(conversationId: string, message: ChatMessage): void {
    if (!conversationId || !message) return;
    const current = _memoryMessageCache.get(conversationId) || [];
    const filtered = current.filter((m) => m.id !== message.id);
    const updated = [message, ...filtered]
      .sort((a, b) => {
        const timeA = new Date(a.sentAt).getTime();
        const timeB = new Date(b.sentAt).getTime();
        return timeB - timeA;
      })
      .slice(0, MAX_CACHED_MESSAGES_PER_THREAD);
    _memoryMessageCache.set(conversationId, updated);
    void AsyncStorage.setItem(`${MESSAGES_PREFIX}${conversationId}`, JSON.stringify(updated)).catch((e) => {
      console.warn(`[OfflineEngine] Failed to persist single message for ${conversationId}:`, e);
    });
  },

  /**
   * Get cached messages for a conversation. Checks in-memory hot cache first,
   * then falls back to AsyncStorage.
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!conversationId) return [];

    if (_memoryMessageCache.has(conversationId)) {
      return _memoryMessageCache.get(conversationId) || [];
    }

    try {
      const raw = await AsyncStorage.getItem(`${MESSAGES_PREFIX}${conversationId}`);
      if (raw) {
        const parsed: ChatMessage[] = JSON.parse(raw);
        _memoryMessageCache.set(conversationId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`[OfflineEngine] Failed to read cached messages for ${conversationId}:`, e);
    }
    return [];
  },

  /**
   * Save messages for a conversation. Merges existing cache with incoming,
   * de-duplicates by message ID, sorts descending by sentAt, and limits to 300.
   */
  async saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
    if (!conversationId || !messages || messages.length === 0) return;

    try {
      const current = await this.getMessages(conversationId);
      const mergedMap = new Map<string, ChatMessage>();

      // Populate current
      current.forEach((m) => mergedMap.set(m.id, m));
      // Overwrite/insert new
      messages.forEach((m) => mergedMap.set(m.id, m));

      // Sort descending (newest first)
      const sorted = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = new Date(a.sentAt).getTime();
        const timeB = new Date(b.sentAt).getTime();
        return timeB - timeA;
      });

      // Keep up to MAX_CACHED_MESSAGES_PER_THREAD
      const bounded = sorted.slice(0, MAX_CACHED_MESSAGES_PER_THREAD);

      _memoryMessageCache.set(conversationId, bounded);
      await AsyncStorage.setItem(`${MESSAGES_PREFIX}${conversationId}`, JSON.stringify(bounded));
    } catch (e) {
      console.warn(`[OfflineEngine] Failed to save messages for ${conversationId}:`, e);
    }
  },

  /**
   * Atomically updates a message status (e.g. from 'sending' to 'sent' or 'error')
   * and optionally swaps its temporary client ID for the official server ID.
   */
  async updateMessageStatus(
    conversationId: string,
    targetId: string,
    newId: string | null,
    newStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'error',
    serverTimestamp?: string
  ): Promise<void> {
    const list = await this.getMessages(conversationId);
    let updated = false;

    const nextList = list.map((m) => {
      if (m.id === targetId) {
        updated = true;
        return {
          ...m,
          id: newId || m.id,
          status: newStatus,
          sentAt: serverTimestamp || m.sentAt,
        };
      }
      return m;
    });

    if (updated) {
      _memoryMessageCache.set(conversationId, nextList);
      try {
        await AsyncStorage.setItem(`${MESSAGES_PREFIX}${conversationId}`, JSON.stringify(nextList));
      } catch (e) {
        console.warn(`[OfflineEngine] Failed to update message status for ${targetId}:`, e);
      }
    }
  },

  /**
   * Get the latest sentAt timestamp recorded in cache for this conversation.
   * Used for keyset delta-sync on reconnection.
   */
  async getLatestTimestamp(conversationId: string): Promise<string | null> {
    const list = await this.getMessages(conversationId);
    if (!list || list.length === 0) return null;

    // Filter out optimistic/unsent messages to only get confirmed server messages
    const confirmed = list.filter((m) => !m.id.startsWith('optimistic-') && m.status !== 'sending');
    if (confirmed.length === 0) return null;

    let maxTime = 0;
    let maxIso: string | null = null;
    confirmed.forEach((m) => {
      const t = new Date(m.sentAt).getTime();
      if (t > maxTime) {
        maxTime = t;
        maxIso = m.sentAt;
      }
    });

    return maxIso;
  },

  // -------------------------------------------------------------
  // 2. Inbox Conversations Persistence
  // -------------------------------------------------------------

  /**
   * Synchronously get a cached conversation from in-memory hot cache for instant 0ms Frame 1 rendering.
   */
  getConversationSync(conversationId: string): ChatConversation | null {
    if (!conversationId || !_memoryConversationsCache) return null;
    return _memoryConversationsCache.find((c) => c.id === conversationId) || null;
  },

  async getConversations(): Promise<ChatConversation[]> {
    if (_memoryConversationsCache) {
      return _memoryConversationsCache;
    }

    try {
      const raw = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (raw) {
        const parsed: ChatConversation[] = JSON.parse(raw);
        _memoryConversationsCache = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('[OfflineEngine] Failed to read cached conversations:', e);
    }
    return [];
  },

  async saveConversations(convos: ChatConversation[]): Promise<void> {
    _memoryConversationsCache = convos;
    try {
      await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(convos));
    } catch (e) {
      console.warn('[OfflineEngine] Failed to save conversations to cache:', e);
    }
  },

  /**
   * Synchronously update or insert a single conversation in hot cache.
   */
  saveSingleConversation(conversation: ChatConversation): void {
    if (!conversation?.id) return;
    if (_memoryConversationsCache) {
      const idx = _memoryConversationsCache.findIndex((c) => c.id === conversation.id);
      if (idx >= 0) {
        _memoryConversationsCache[idx] = { ..._memoryConversationsCache[idx], ...conversation };
      } else {
        _memoryConversationsCache.unshift(conversation);
      }
    }
  },

  // -------------------------------------------------------------
  // 3. Resilient Outbox (Offline Queue)
  // -------------------------------------------------------------

  async getOutbox(conversationId?: string): Promise<OutboxItem[]> {
    if (!_memoryOutbox) {
      try {
        const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
        _memoryOutbox = raw ? JSON.parse(raw) : [];
      } catch {
        _memoryOutbox = [];
      }
    }

    if (!conversationId) {
      return _memoryOutbox || [];
    }

    return (_memoryOutbox || []).filter((item) => item.conversationId === conversationId);
  },

  async enqueueOutbox(item: OutboxItem): Promise<void> {
    const queue = await this.getOutbox();
    // Prevent duplicate enqueuing
    const filtered = queue.filter((q) => q.id !== item.id);
    filtered.push(item);
    _memoryOutbox = filtered;

    try {
      await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('[OfflineEngine] Failed to enqueue outbox item:', e);
    }
  },

  async removeOutbox(id: string): Promise<void> {
    const queue = await this.getOutbox();
    const nextQueue = queue.filter((q) => q.id !== id);
    _memoryOutbox = nextQueue;

    try {
      await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(nextQueue));
    } catch (e) {
      console.warn(`[OfflineEngine] Failed to remove outbox item ${id}:`, e);
    }
  },

  async incrementOutboxRetry(id: string, error?: string): Promise<void> {
    const queue = await this.getOutbox();
    const nextQueue = queue.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          retryCount: q.retryCount + 1,
          error: error || q.error || null,
        };
      }
      return q;
    });
    _memoryOutbox = nextQueue;

    try {
      await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(nextQueue));
    } catch (e) {
      console.warn(`[OfflineEngine] Failed to update outbox item ${id}:`, e);
    }
  },

  async clearOutbox(conversationId?: string): Promise<void> {
    if (conversationId) {
      const queue = await this.getOutbox();
      const nextQueue = queue.filter((q) => q.conversationId !== conversationId);
      _memoryOutbox = nextQueue;
      await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(nextQueue));
    } else {
      _memoryOutbox = [];
      await AsyncStorage.removeItem(OUTBOX_STORAGE_KEY);
    }
  },
};

export default OfflineEngine;
