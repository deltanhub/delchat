import { supabase } from '../../supabase';

/**
 * Fetch active ringing or accepted call session for deep-link situations.
 */
export async function fetchActiveCallSession(conversationId: string): Promise<{
  id: string;
  callMode: 'audio' | 'video';
  callStatus: string;
  initiatorUserId: string;
} | null> {
  try {
    const { data: session } = await supabase
      .from('chat_call_sessions')
      .select('id, call_mode, call_status, initiated_by_user_id')
      .eq('conversation_id', conversationId)
      .in('call_status', ['ringing', 'accepted'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) return null;
    return {
      id: session.id,
      callMode: session.call_mode === 'video' ? 'video' : 'audio',
      callStatus: session.call_status,
      initiatorUserId: session.initiated_by_user_id,
    };
  } catch {
    return null;
  }
}

/**
 * Update call session in chat_call_sessions.
 */
export async function updateCallSession(
  callId: string,
  updates: {
    callStatus?: string;
    callMode?: string;
    endedAt?: string;
    endedByUserId?: string;
    endReason?: string;
    durationSeconds?: number;
    acceptedAt?: string;
  }
): Promise<void> {
  const payload: Record<string, any> = {};
  if (updates.callStatus) payload.call_status = updates.callStatus;
  if (updates.callMode) payload.call_mode = updates.callMode;
  if (updates.endedAt) payload.ended_at = updates.endedAt;
  if (updates.endedByUserId) payload.ended_by_user_id = updates.endedByUserId;
  if (updates.endReason) payload.end_reason = updates.endReason;
  if (typeof updates.durationSeconds === 'number') payload.duration_seconds = updates.durationSeconds;
  if (updates.acceptedAt) payload.accepted_at = updates.acceptedAt;

  await supabase.from('chat_call_sessions').update(payload).eq('id', callId);
}

/**
 * Update participant status in chat_call_participants.
 */
export async function updateParticipantStatus(
  callId: string,
  userId: string,
  status: string,
  timestamp?: { field: 'joined_at' | 'left_at'; value: string }
): Promise<void> {
  const payload: Record<string, any> = {
    participant_status: status,
  };
  if (timestamp) {
    payload[timestamp.field] = timestamp.value;
  }

  await supabase
    .from('chat_call_participants')
    .update(payload)
    .eq('call_id', callId)
    .eq('user_id', userId);
}
