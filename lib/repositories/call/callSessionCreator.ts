import { supabase } from '../../supabase';

/**
 * Create a call session in chat_call_sessions and initialize participants.
 */
export async function createCallSession(params: {
  conversationId: string;
  initiatorUserId: string;
  callMode: 'audio' | 'video';
}): Promise<{ sessionId: string; invitedUserIds: string[] } | null> {
  const { conversationId, initiatorUserId, callMode } = params;
  const expiresAt = new Date(Date.now() + 90000).toISOString();

  // Pre-emptively clear any stale or lingering active sessions for this conversation
  // to prevent duplicate key violations of chat_call_sessions_one_active_per_conversation_idx.
  try {
    await supabase
      .from('chat_call_sessions')
      .update({
        call_status: 'canceled',
        ended_at: new Date().toISOString(),
        end_reason: 'superseded_by_new_call',
      })
      .eq('conversation_id', conversationId)
      .in('call_status', ['ringing', 'accepted']);
  } catch {
    // Non-blocking cleanup attempt
  }

  let { data: session, error: sessionErr } = await supabase
    .from('chat_call_sessions')
    .insert({
      conversation_id: conversationId,
      initiated_by_user_id: initiatorUserId,
      call_mode: callMode,
      call_status: 'ringing',
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  // If a collision occurs due to in-flight state or network lag, sweep again and retry once
  if (
    sessionErr &&
    (sessionErr.code === '23505' ||
      sessionErr.message?.includes('chat_call_sessions_one_active_per_conversation_idx') ||
      sessionErr.message?.includes('duplicate key'))
  ) {
    console.warn('[callRepository] Active call session collision detected. Retrying after session cleanup...');
    await supabase
      .from('chat_call_sessions')
      .update({
        call_status: 'canceled',
        ended_at: new Date().toISOString(),
        end_reason: 'superseded_by_new_call',
      })
      .eq('conversation_id', conversationId)
      .in('call_status', ['ringing', 'accepted']);

    const retryResult = await supabase
      .from('chat_call_sessions')
      .insert({
        conversation_id: conversationId,
        initiated_by_user_id: initiatorUserId,
        call_mode: callMode,
        call_status: 'ringing',
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    session = retryResult.data;
    sessionErr = retryResult.error;
  }

  if (sessionErr || !session) {
    console.warn('[callRepository] Failed to create call session:', sessionErr?.message);
    throw sessionErr || new Error('Failed to create call session');
  }

  // Resolve conversation participants
  const { data: convParticipants } = await supabase
    .from('chat_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .is('removed_at', null);

  const participants = convParticipants || [];
  const invitedUserIds = participants
    .filter((p: any) => p.user_id !== initiatorUserId)
    .map((p: any) => p.user_id);

  if (participants.length > 0) {
    await supabase.from('chat_call_participants').upsert(
      participants.map((p: any) => ({
        call_id: session.id,
        conversation_id: conversationId,
        user_id: p.user_id,
        participant_status: p.user_id === initiatorUserId ? 'accepted' : 'invited',
        is_initiator: p.user_id === initiatorUserId,
        joined_at: p.user_id === initiatorUserId ? new Date().toISOString() : null,
      }))
    );
  }

  return {
    sessionId: session.id,
    invitedUserIds,
  };
}
