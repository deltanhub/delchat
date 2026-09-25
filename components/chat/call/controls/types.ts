export interface CallControlsDockProps {
  phase: 'outgoing' | 'incoming' | 'connected' | 'ended';
  callKind: 'audio' | 'video';
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  isVideoOff?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onEndCall?: () => void;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onToggleVideo?: () => void;
  onSwitchCamera?: () => void;
  bottomInset: number;
}

export interface VideoControlsPillProps {
  bottomInset: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  onToggleMute?: () => void;
  onSwitchCamera?: () => void;
  onToggleVideo?: () => void;
  onToggleSpeaker?: () => void;
  onEndCall?: () => void;
}

export interface IncomingCallActionsProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export interface InCallAudioControlsProps {
  isVideoMode: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isVideoOff: boolean;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onToggleVideo?: () => void;
  onEndCall?: () => void;
}
