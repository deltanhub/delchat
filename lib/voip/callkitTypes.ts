export interface CallKitOptions {
  appName: string;
  imageName?: string;
  ringtoneSound?: string;
  maximumCallGroups?: string;
  maximumCallsPerCallGroup?: string;
  supportsVideo?: boolean;
  includesCallsInRecents?: boolean;
}

export interface IncomingCallPayload {
  callUuid: string;
  handle: string;
  contactName: string;
  hasVideo?: boolean;
  conversationId?: string;
  extraPayload?: Record<string, unknown>;
}

export interface OutgoingCallPayload {
  callUuid: string;
  handle: string;
  contactName: string;
  isVideo?: boolean;
}

export interface CallKitActionCallbacks {
  onAnswerCall?: (callUuid: string) => void;
  onEndCall?: (callUuid: string) => void;
  onToggleMute?: (callUuid: string, isMuted: boolean) => void;
}

export interface CallKitState {
  isInitialized: boolean;
  isNativeSupported: boolean;
  activeCallUuid: string | null;
  callbacks: CallKitActionCallbacks;
}

export const defaultCallKitOptions: CallKitOptions = {
  appName: 'DelChat',
  imageName: 'callkit_logo',
  ringtoneSound: 'call_ringtone.wav',
  maximumCallGroups: '1',
  maximumCallsPerCallGroup: '1',
  supportsVideo: true,
  includesCallsInRecents: true,
};
