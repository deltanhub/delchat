import { supabase } from '../../supabase';
import { dispatchVoipCallPush } from '../../services/voipPushService';

/**
 * Broadcast incoming call notification to recipients with guaranteed channel removal.
 * Eliminates channel memory leaks on the Supabase client.
 */
export function broadcastIncomingCallNotification(
  invitedUserIds: string[],
  payload: {
    callId: string;
    conversationId: string;
    callMode: 'audio' | 'video';
    callerUserId: string;
    callerName: string;
    callerAvatarUrl: string | null;
  }
): void {
  // Concurrently trigger native APNs VoIP PushKit & Android FCM High-Priority Data Messages
  void dispatchVoipCallPush({
    callId: payload.callId,
    conversationId: payload.conversationId,
    recipientUserIds: invitedUserIds,
    callerId: payload.callerUserId,
    callerName: payload.callerName,
    callerAvatarUrl: payload.callerAvatarUrl,
    callKind: payload.callMode,
  });

  invitedUserIds.forEach((targetUserId) => {
    const channelName = `user-call-listener-${targetUserId}`;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) {
      void supabase.removeChannel(existing);
    }
    const notifyChannel = supabase.channel(channelName);

    let teardownTimer: any = null;
    const cleanupChannel = () => {
      if (teardownTimer) clearTimeout(teardownTimer);
      void supabase.removeChannel(notifyChannel);
    };

    teardownTimer = setTimeout(cleanupChannel, 3000);

    notifyChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void notifyChannel
          .send({
            type: 'broadcast',
            event: 'incoming_call',
            payload,
          })
          .finally(() => {
            setTimeout(cleanupChannel, 400);
          });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        cleanupChannel();
      }
    });
  });
}
