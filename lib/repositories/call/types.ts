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
