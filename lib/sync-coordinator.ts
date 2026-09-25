import { supabase } from './supabase';
import type { ChatMessage } from '../components/chat/bubbles/types';
import {
  SyncStatus,
  calculateJitter,
  touchUserPresenceSafely,
  getStatus,
  setStatus,
  checkConnectivity,
  subscribe,
  drainOutbox,
  executeDeltaSync,
  broadcastInboxAlert,
} from './sync';

export type { SyncStatus };
export const PRESENCE_TOUCH_THROTTLE_MS = 30000;
// In-flight probe coalescing: _inFlightConnectivityPromise managed via networkMonitor
export { calculateJitter, touchUserPresenceSafely, broadcastInboxAlert };

/**
 * 500k CCU Enterprise Sync Coordinator.
 * Coordinates network status, resilient FIFO outbox drain, and delta sync.
 * Targets production table: supabase.from('chat_message_attachments')
 */
export const SyncCoordinator = {
  getStatus(): SyncStatus {
    return getStatus();
  },

  setStatus(status: SyncStatus): void {
    setStatus(status);
  },

  async checkConnectivity(): Promise<boolean> {
    return checkConnectivity();
  },

  subscribe(listener: (status: SyncStatus) => void): () => void {
    return subscribe(listener);
  },

  async drainOutbox(
    supabaseClient: any = supabase,
    conversationId?: string,
    onMessageSent?: (tempId: string, serverData: any) => void
  ): Promise<number> {
    return drainOutbox(supabaseClient, conversationId, onMessageSent);
  },

  async executeDeltaSync(
    supabaseClient: any = supabase,
    conversationId: string,
    currentUserId?: string
  ): Promise<ChatMessage[]> {
    return executeDeltaSync(supabaseClient, conversationId, currentUserId);
  },

  broadcastInboxAlert(params: {
    recipientUserId?: string | null;
    conversationId: string;
    senderUserId?: string | null;
  }): void {
    broadcastInboxAlert(params);
  },
};

export default SyncCoordinator;
