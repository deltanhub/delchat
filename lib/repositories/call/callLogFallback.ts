import { supabase } from '../../supabase';
import { ChatCallStatus, RecordCallLogParams } from './types';

/**
 * Resilient Fallback Logging
 * When a mobile call finishes or fails, ensures a system message with structured callLog payload
 * is guaranteed to be stored in chat_messages and synchronized in chat_call_sessions.
 */
export async function recordCallLogFallback(params: RecordCallLogParams): Promise<void> {
  const {
    callId,
    conversationId,
    actorUserId,
    callMode,
    action,
    durationSeconds = 0,
  } = params;

  const nowIso = new Date().toISOString();
  let callStatus: ChatCallStatus = 'ended';
  if (action === 'decline') callStatus = 'declined';
  else if (action === 'missed') callStatus = 'missed';
  else if (action === 'cancel') callStatus = 'canceled';

  // 1. Update session in chat_call_sessions
  try {
    await supabase
      .from('chat_call_sessions')
      .update({
        call_status: callStatus,
        ended_at: nowIso,
        ended_by_user_id: actorUserId,
        duration_seconds: durationSeconds,
        end_reason: `action_${action}`,
      })
      .eq('id', callId);

    await supabase
      .from('chat_call_participants')
      .update({
        participant_status: action === 'decline' ? 'declined' : 'left',
        left_at: nowIso,
      })
      .eq('call_id', callId)
      .eq('user_id', actorUserId);
  } catch {
    // Swallowed: best-effort session sync
  }

  // 2. Check if chat_messages already contains a callLog for this callId
  try {
    const { data: existing } = await supabase
      .from('chat_messages')
      .select('id')
      .contains('structured_payload', { callLog: { callId } })
      .maybeSingle();

    if (existing) {
      return; // Already recorded by server or peer
    }

    // Build text body matching DeltanHub web
    const modeLabel = callMode === 'video' ? 'Video call' : 'Voice call';
    let body = modeLabel;

    if (callStatus === 'ended') {
      if (durationSeconds > 0) {
        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        body = `${modeLabel} ended (${durationStr})`;
      } else {
        body = `${modeLabel} ended`;
      }
    } else if (callStatus === 'declined') {
      body = `Declined ${callMode} call`;
    } else if (callStatus === 'missed') {
      body = `Missed ${callMode} call`;
    } else if (callStatus === 'canceled') {
      body = `Canceled ${callMode} call`;
    }

    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_type: 'system',
      message_kind: 'system',
      body,
      structured_payload: {
        callLog: {
          callId,
          callMode,
          callStatus,
          initiatedByUserId: actorUserId,
          endedByUserId: actorUserId,
          startedAt: nowIso,
          endedAt: nowIso,
          durationSeconds,
        },
      },
    });
  } catch (err) {
    console.warn('[callRepository] Error inserting fallback callLog message:', err);
  }
}
