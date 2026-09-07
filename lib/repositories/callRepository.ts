import { supabase } from '../supabase';
import { fetchWithAuth } from '../api-client';

export type ChatCallMode = 'audio' | 'video';
export type ChatCallStatus =
  | 'initiated'
  | 'ringing'
  | 'accepted'
  | 'declined'
  | 'ended'
  | 'missed'
  | 'canceled'
  | 'failed';

export type ChatCallDirection = 'incoming' | 'outgoing' | 'missed';

export interface ChatCallPeer {
  userId: string;
  displayName: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  phone: string;
  email: string;
  mainRole: string;
}

export interface ChatCallLog {
  id: string;
  conversationId: string;
  callMode: ChatCallMode;
  callStatus: ChatCallStatus;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
  initiatedByUserId: string;
  direction: ChatCallDirection;
  peer: ChatCallPeer;
}

export interface GroupedChatCallLog extends ChatCallLog {
  count: number;
}

export interface RecordCallLogParams {
  callId: string;
  conversationId: string;
  actorUserId: string;
  partnerUserId?: string;
  callMode: 'audio' | 'video';
  action: 'accept' | 'decline' | 'end' | 'missed' | 'cancel';
  durationSeconds?: number;
}

/**
 * Domain Call Repository
 * Encapsulates call log fetching, real-time synchronization, grouping, and fallback logging.
 * Mirrors DeltanHub web lib/chat-calls.ts and app/chats/chats-workspace.tsx 1:1.
 */
export const callRepository = {
  /**
   * Fetch all call logs for the active user.
   * Primary: Web API `/api/chats/calls/logs`.
   * Fallback: Direct Supabase join across chat_call_participants, chat_call_sessions, and user_profiles.
   */
  async fetchCallLogs(actorUserId: string): Promise<ChatCallLog[]> {
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

      // 3. Fetch other participants from both chat_call_participants and chat_participants (as fallback)
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
        if (p.user_id && p.user_id !== actorUserId) {
          peerUserIds.add(p.user_id);
        }
      });
      (convParticipants || []).forEach((p: any) => {
        if (p.user_id && p.user_id !== actorUserId) {
          peerUserIds.add(p.user_id);
        }
      });

      // 4. Fetch profiles for peers using get_public_user_profiles RPC to safely bypass RLS
      const profileMap = new Map<string, any>();
      if (peerUserIds.size > 0) {
        const { data: profData } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: Array.from(peerUserIds),
        });

        if (profData && Array.isArray(profData)) {
          profData.forEach((prof: any) => {
            if (prof.user_id) {
              profileMap.set(prof.user_id, prof);
            }
          });
        }
      }

      // 5. Map to ChatCallLog matching DeltanHub web schema
      return sessions.map((session: any) => {
        const myPart = participations.find((p) => p.call_id === session.id);
        const sessionParts = (allParticipants || []).filter((p: any) => p.call_id === session.id);
        const peerPart = sessionParts.find((p: any) => p.user_id !== actorUserId);

        let peerUserId = peerPart?.user_id;
        if (!peerUserId && session.conversation_id) {
          peerUserId = (convParticipants || []).find(
            (p: any) => p.conversation_id === session.conversation_id && p.user_id !== actorUserId
          )?.user_id;
        }

        const peerProfile = peerUserId ? profileMap.get(peerUserId) : null;

        let direction: ChatCallDirection = 'incoming';
        if (session.initiated_by_user_id === actorUserId) {
          direction = 'outgoing';
        } else if (myPart?.participant_status === 'missed' || session.call_status === 'missed') {
          direction = 'missed';
        }

        let durationSeconds = 0;
        if (session.answered_at && session.ended_at) {
          durationSeconds = Math.max(
            0,
            Math.floor(
              (new Date(session.ended_at).getTime() - new Date(session.answered_at).getTime()) / 1000
            )
          );
        }

        const displayName =
          peerProfile?.display_name?.trim() ||
          peerProfile?.full_name?.trim() ||
          peerProfile?.username?.trim() ||
          (peerUserId ? 'User' : 'Unknown User');

        const fullName =
          peerProfile?.full_name?.trim() ||
          peerProfile?.display_name?.trim() ||
          displayName;

        return {
          id: session.id,
          conversationId: session.conversation_id,
          callMode: session.call_mode as ChatCallMode,
          callStatus: session.call_status as ChatCallStatus,
          startedAt: session.started_at,
          endedAt: session.ended_at,
          durationSeconds,
          initiatedByUserId: session.initiated_by_user_id,
          direction,
          peer: {
            userId: peerUserId || '',
            displayName,
            fullName,
            username: peerProfile?.username || 'user',
            avatarUrl: peerProfile?.avatar_url || null,
            phone: peerProfile?.phone || '',
            email: peerProfile?.email || '',
            mainRole: peerProfile?.main_role || 'Buyer',
          },
        };
      });
    } catch (err) {
      console.warn('[callRepository] Error fetching call logs:', err);
      return [];
    }
  },

  /**
   * Resilient Fallback Logging
   * When a mobile call finishes or fails, ensures a system message with structured callLog payload
   * is guaranteed to be stored in chat_messages and synchronized in chat_call_sessions.
   */
  async recordCallLogFallback(params: RecordCallLogParams): Promise<void> {
    const {
      callId,
      conversationId,
      actorUserId,
      partnerUserId,
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
  },

  /**
   * Group consecutive call logs by peer, mode, direction, and date.
   * Matches DeltanHub web chats-workspace.tsx lines 2968-3007.
   */
  groupCallLogs(callLogs: ChatCallLog[], query: string = ''): GroupedChatCallLog[] {
    const q = query.trim().toLowerCase();
    const grouped: GroupedChatCallLog[] = [];
    let currentGroup: GroupedChatCallLog | null = null;

    for (const log of callLogs) {
      if (q) {
        const matchesName =
          (log.peer.displayName || '').toLowerCase().includes(q) ||
          (log.peer.fullName || '').toLowerCase().includes(q) ||
          (log.peer.username || '').toLowerCase().includes(q) ||
          (log.peer.phone || '').toLowerCase().includes(q);
        if (!matchesName) continue;
      }

      const logDateStr = new Date(log.startedAt).toDateString();
      const prevDateStr = currentGroup ? new Date(currentGroup.startedAt).toDateString() : '';

      if (
        currentGroup &&
        currentGroup.peer.userId === log.peer.userId &&
        currentGroup.direction === log.direction &&
        currentGroup.callMode === log.callMode &&
        logDateStr === prevDateStr
      ) {
        currentGroup.count += 1;
      } else {
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentGroup = { ...log, count: 1 };
      }
    }

    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped;
  },

  /**
   * Format call timestamp relative to today.
   * Matches DeltanHub web chats-workspace.tsx lines 3009-3034.
   */
  formatCallTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();

      const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const diffTime = dNow.getTime() - dDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
      } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch {
      return '';
    }
  },
};
