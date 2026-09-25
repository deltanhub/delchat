export type CallPhase = 'outgoing' | 'incoming' | 'connected' | 'ended';

export interface CallModalProps {
  visible: boolean;
  callKind: 'audio' | 'video';
  phase: CallPhase;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerRole?: string | null;
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  isVideoOff?: boolean;
  remoteIsMuted?: boolean;
  remoteIsVideoOff?: boolean;
  durationSeconds?: number;
  connectionHealth?: 'connected' | 'reconnecting' | 'failed';
  onAccept?: () => void;
  onDecline?: () => void;
  onEndCall?: () => void;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onToggleVideo?: () => void;
  onSwitchCamera?: () => void;
  localStream?: any;
  remoteStream?: any;
}

export function formatCallDuration(durationSeconds: number): string {
  const mins = Math.floor(durationSeconds / 60);
  const rem = durationSeconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

export function getCallStatusText(phase: CallPhase, durationSeconds: number): string {
  if (phase === 'connected') return formatCallDuration(durationSeconds);
  if (phase === 'outgoing') return 'Calling...';
  if (phase === 'incoming') return 'Incoming call...';
  return 'Call ended';
}
