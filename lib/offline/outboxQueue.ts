import AsyncStorage from '@react-native-async-storage/async-storage';
import { OUTBOX_STORAGE_KEY, OutboxItem } from './types';

let _memoryOutbox: OutboxItem[] | null = null;

export async function getOutbox(conversationId?: string): Promise<OutboxItem[]> {
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
}

export async function enqueueOutbox(item: OutboxItem): Promise<void> {
  const queue = await getOutbox();
  // Prevent duplicate enqueuing
  const filtered = queue.filter((q) => q.id !== item.id);
  filtered.push(item);
  _memoryOutbox = filtered;

  try {
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('[OfflineEngine] Failed to enqueue outbox item:', e);
  }
}

export async function removeOutbox(id: string): Promise<void> {
  const queue = await getOutbox();
  const nextQueue = queue.filter((q) => q.id !== id);
  _memoryOutbox = nextQueue;

  try {
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(nextQueue));
  } catch (e) {
    console.warn(`[OfflineEngine] Failed to remove outbox item ${id}:`, e);
  }
}

export async function incrementOutboxRetry(id: string, error?: string): Promise<void> {
  const queue = await getOutbox();
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
}

export async function clearOutbox(conversationId?: string): Promise<void> {
  if (conversationId) {
    const queue = await getOutbox();
    const nextQueue = queue.filter((q) => q.conversationId !== conversationId);
    _memoryOutbox = nextQueue;
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(nextQueue));
  } else {
    _memoryOutbox = [];
    await AsyncStorage.removeItem(OUTBOX_STORAGE_KEY);
  }
}
