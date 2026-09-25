import { supabase } from '../supabase';
import { InboxAlertParams } from './types';

/**
 * Zero-DB Realtime WebSocket Broadcast to recipient inbox.
 * Pushes sub-50ms instant signal to recipient's inbox channel without database load.
 */
export function broadcastInboxAlert(params: InboxAlertParams): void {
  const { recipientUserId, conversationId, senderUserId } = params;
  if (!recipientUserId) return;
  try {
    const channelName = `inbox-sync-${recipientUserId}`;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing && (existing.state === 'joined' || (existing as any).status === 'SUBSCRIBED')) {
      void existing.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { conversationId, senderId: senderUserId },
      });
      return;
    }

    if (existing) {
      void supabase.removeChannel(existing);
    }

    const channel = supabase.channel(channelName);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: { conversationId, senderId: senderUserId },
        });
        setTimeout(() => {
          void supabase.removeChannel(channel);
        }, 2000);
      }
    });
  } catch (err) {
    console.warn('[SyncCoordinator] Non-blocking broadcast alert notice:', err);
  }
}
