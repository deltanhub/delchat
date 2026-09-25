import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../../components/chat/MessageBubble';
import { MESSAGES_PREFIX, MAX_CACHED_MESSAGES_PER_THREAD } from './types';

// In-memory hot cache for instant 0ms latency rendering
const _memoryMessageCache = new Map<string, ChatMessage[]>();

/** Synchronously get cached messages from in-memory hot cache (0ms Frame 1) */
export function getMessagesSync(conversationId: string): ChatMessage[] {
  if (!conversationId) return [];
  return _memoryMessageCache.get(conversationId) || [];
}

/** Synchronously update in-memory hot cache and persist asynchronously */
export function saveSingleMessage(conversationId: string, message: ChatMessage): void {
  if (!conversationId || !message) return;
  const current = _memoryMessageCache.get(conversationId) || [];
  const filtered = current.filter((m) => m.id !== message.id);
  const updated = [message, ...filtered]
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, MAX_CACHED_MESSAGES_PER_THREAD);
  _memoryMessageCache.set(conversationId, updated);
  void AsyncStorage.setItem(`${MESSAGES_PREFIX}${conversationId}`, JSON.stringify(updated)).catch((e) => {
    console.warn(`[OfflineEngine] Failed to persist single message for ${conversationId}:`, e);
  });
}

/** Get cached messages from in-memory hot cache or fallback to AsyncStorage */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
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
}

/** Save messages: merge cache, de-duplicate, sort descending, bound to 300 */
export async function saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
  if (!conversationId || !messages || messages.length === 0) return;
  try {
    const current = await getMessages(conversationId);
    const mergedMap = new Map<string, ChatMessage>();
    current.forEach((m) => mergedMap.set(m.id, m));
    messages.forEach((m) => mergedMap.set(m.id, m));

    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
    const bounded = sorted.slice(0, MAX_CACHED_MESSAGES_PER_THREAD);
    _memoryMessageCache.set(conversationId, bounded);
    await AsyncStorage.setItem(`${MESSAGES_PREFIX}${conversationId}`, JSON.stringify(bounded));
  } catch (e) {
    console.warn(`[OfflineEngine] Failed to save messages for ${conversationId}:`, e);
  }
}

/** Atomically update message status and optionally swap temporary client ID */
export async function updateMessageStatus(
  conversationId: string,
  targetId: string,
  newId: string | null,
  newStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'error',
  serverTimestamp?: string
): Promise<void> {
  const list = await getMessages(conversationId);
  let updated = false;
  const nextList = list.map((m) => {
    if (m.id === targetId) {
      updated = true;
      return { ...m, id: newId || m.id, status: newStatus, sentAt: serverTimestamp || m.sentAt };
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
}

/** Get latest confirmed sentAt timestamp for keyset delta-sync */
export async function getLatestTimestamp(conversationId: string): Promise<string | null> {
  const list = await getMessages(conversationId);
  if (!list || list.length === 0) return null;
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
}
