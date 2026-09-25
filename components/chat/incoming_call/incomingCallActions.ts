import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { resolveAvatarUrl } from '../../../lib/media-utils';
import { IncomingCallData } from './types';

export async function acceptCallSession(
  callSnapshot: IncomingCallData,
  currentUserId: string,
  router: ReturnType<typeof useRouter>
) {
  try {
    await supabase.from('chat_call_sessions')
      .update({ call_status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', callSnapshot.callId);
    await supabase.from('chat_call_participants')
      .update({ participant_status: 'accepted', joined_at: new Date().toISOString() })
      .eq('call_id', callSnapshot.callId)
      .eq('user_id', currentUserId);
    router.push({
      pathname: '/call/[id]',
      params: {
        id: callSnapshot.conversationId,
        kind: callSnapshot.callMode,
        role: 'receiver',
        callId: callSnapshot.callId,
        partnerUserId: callSnapshot.callerUserId,
        partnerName: callSnapshot.callerName,
        partnerAvatarUrl: callSnapshot.callerAvatarUrl || '',
      },
    });
  } catch (err) {
    console.warn('Error accepting call session:', err);
  }
}

export async function declineCallSession(
  callSnapshot: IncomingCallData,
  currentUserId: string
) {
  try {
    await supabase.from('chat_call_sessions').update({
      call_status: 'declined',
      ended_at: new Date().toISOString(),
      ended_by_user_id: currentUserId,
      end_reason: 'recipient_declined',
    }).eq('id', callSnapshot.callId);
    await supabase.from('chat_call_participants').update({
      participant_status: 'declined',
      left_at: new Date().toISOString(),
    }).eq('call_id', callSnapshot.callId).eq('user_id', currentUserId);
  } catch (err) {
    console.warn('Error declining call session:', err);
  }
}

export async function declineCallBusy(callId: string) {
  try {
    await supabase.from('chat_call_sessions').update({
      call_status: 'declined',
      ended_at: new Date().toISOString(),
      end_reason: 'recipient_busy',
    }).eq('id', callId);
  } catch (err) {
    console.warn('Error declining busy call session:', err);
  }
}

export async function fetchCallParticipantMetadata(participant: any): Promise<IncomingCallData | null> {
  if (!participant || participant.is_initiator || participant.participant_status !== 'invited') return null;
  const { data: session } = await supabase.from('chat_call_sessions')
    .select('id, conversation_id, call_mode, initiated_by_user_id, call_status')
    .eq('id', participant.call_id).maybeSingle();
  if (!session || session.call_status !== 'ringing') return null;
  let callerName = 'DeltanHub Member';
  let callerAvatarUrl: string | null = null;
  try {
    const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
      requested_user_ids: [session.initiated_by_user_id],
    });
    if (profiles && profiles[0]) {
      callerName = profiles[0].display_name?.trim() || profiles[0].full_name?.trim() || 'DeltanHub Member';
      callerAvatarUrl = resolveAvatarUrl(profiles[0].avatar_url);
    }
  } catch {}
  return {
    callId: session.id,
    conversationId: session.conversation_id,
    callMode: session.call_mode === 'video' ? 'video' : 'audio',
    callerUserId: session.initiated_by_user_id,
    callerName,
    callerAvatarUrl,
  };
}
