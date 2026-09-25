export interface IncomingCallData {
  callId: string;
  conversationId: string;
  callMode: 'audio' | 'video';
  callerUserId: string;
  callerName: string;
  callerAvatarUrl: string | null;
}

export interface IncomingCallCardProps {
  incomingCall: IncomingCallData;
  animatedRingStyle: any;
  onAccept: () => void;
  onDecline: () => void;
}
