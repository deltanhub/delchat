import { supabase } from '../../supabase';
import { fetchWithAuth } from '../../api-client';
import { ChatCallLog } from './types';
import { mapRawSessionToCallLog } from './callLogMapper';

/**
 * Fetch all call logs for the active user.
 * Primary: Web API `/api/chats/calls/logs`.
 * Fallback: Direct Supabase join across chat_call_participants, chat_call_sessions, and user_profiles.
 */
export async function fetchCallLogs(actorUserId: string): Promise<ChatCallLog[]> {
  try {
    const webLogs = await fetchWithAuth('/api/chats/calls/logs');
    if (Array.isArray(webLogs) && webLogs.length > 0) {
      const hasValidPeers = webLogs.some(
        (l) => l.peer?.displayName && l.peer.displayName !== 'Unknown User'
      );
      if (hasValidPeers) {
        return webLogs as ChatCallLog[];
      }
    }
  } catch {
    // Fallback directly to Supabase client query
  }

  try {
    // 1. Get the list of call sessions where the actor is a participant
    const { data: participations, error: partError } = await supabase
      .from('chat_call_participants')
      .select('call_id, participant_status, is_initiator')
      .eq('user_id', actorUserId);

    if (partError || !participations || participations.length === 0) {
      return [];
    }

    const callIds = participations.map((p) => p.call_id);

    // 2. Fetch actual call session records
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_call_sessions')
      .select(
        'id, conversation_id, initiated_by_user_id, call_mode, call_status, started_at, answered_at, ended_at, ended_by_user_id, end_reason'
      )
      .in('id', callIds)
      .order('started_at', { ascending: false });

    if (sessionsError || !sessions || sessions.length === 0) {
      return [];
    }

    const allSessionIds = sessions.map((s) => s.id);
    const convIds = Array.from(
      new Set(sessions.map((s) => s.conversation_id).filter((id): id is string => Boolean(id)))
    );

    // 3. Fetch other participants from both chat_call_participants and chat_participants
    const [{ data: allParticipants }, { data: convParticipants }] = await Promise.all([
      supabase
        .from('chat_call_participants')
        .select('call_id, user_id, participant_status, is_initiator')
        .in('call_id', allSessionIds),
      convIds.length > 0
        ? supabase
            .from('chat_participants')
            .select('conversation_id, user_id, participant_role')
            .in('conversation_id', convIds)
        : Promise.resolve({ data: [] }),
    ]);

    const peerUserIds = new Set<string>();
    (allParticipants || []).forEach((p: any) => {
      if (p.user_id && p.user_id !== actorUserId) peerUserIds.add(p.user_id);
    });
    (convParticipants || []).forEach((p: any) => {
      if (p.user_id && p.user_id !== actorUserId) peerUserIds.add(p.user_id);
    });

    // 4. Fetch profiles for peers using get_public_user_profiles RPC to safely bypass RLS
    const profileMap = new Map<string, any>();
    if (peerUserIds.size > 0) {
      const { data: profData } = await supabase.rpc('get_public_user_profiles', {
        requested_user_ids: Array.from(peerUserIds),
      });

      if (profData && Array.isArray(profData)) {
        profData.forEach((prof: any) => {
          if (prof.user_id) profileMap.set(prof.user_id, prof);
        });
      }
    }

    // 5. Map to ChatCallLog matching DeltanHub web schema
    return sessions.map((session: any) =>
      mapRawSessionToCallLog(
        session,
        actorUserId,
        participations,
        allParticipants || [],
        convParticipants || [],
        profileMap
      )
    );
  } catch (err) {
    console.warn('[callRepository] Error fetching call logs:', err);
    return [];
  }
}
