import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatConversation } from '../../components/chat/ConversationRow';
import { CONVERSATIONS_STORAGE_KEY } from './types';

let _memoryConversationsCache: ChatConversation[] | null = null;

/**
 * Synchronously get a cached conversation from in-memory hot cache for instant 0ms Frame 1 rendering.
 */
export function getConversationSync(conversationId: string): ChatConversation | null {
  if (!conversationId || !_memoryConversationsCache) return null;
  return _memoryConversationsCache.find((c) => c.id === conversationId) || null;
}

export async function getConversations(): Promise<ChatConversation[]> {
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
}

export async function saveConversations(convos: ChatConversation[]): Promise<void> {
  _memoryConversationsCache = convos;
  try {
    await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(convos));
  } catch (e) {
    console.warn('[OfflineEngine] Failed to save conversations to cache:', e);
  }
}

/**
 * Synchronously update or insert a single conversation in hot cache.
 */
export function saveSingleConversation(conversation: ChatConversation): void {
  if (!conversation?.id) return;
  if (_memoryConversationsCache) {
    const idx = _memoryConversationsCache.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      _memoryConversationsCache[idx] = { ..._memoryConversationsCache[idx], ...conversation };
    } else {
      _memoryConversationsCache.unshift(conversation);
    }
  }
}
