import { ChatCallLog, ChatCallMode, ChatCallStatus, ChatCallDirection } from './types';

export function mapRawSessionToCallLog(
  session: any,
  actorUserId: string,
  participations: any[],
  allParticipants: any[],
  convParticipants: any[],
  profileMap: Map<string, any>
): ChatCallLog {
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
      Math.floor((new Date(session.ended_at).getTime() - new Date(session.answered_at).getTime()) / 1000)
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
}
