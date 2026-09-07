import { Platform } from 'react-native';

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
  handle: string; // Phone number, email, or user handle
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

const defaultOptions: CallKitOptions = {
  appName: 'DelChat',
  imageName: 'callkit_logo',
  ringtoneSound: 'call_ringtone.wav',
  maximumCallGroups: '1',
  maximumCallsPerCallGroup: '1',
  supportsVideo: true,
  includesCallsInRecents: true,
};

class CallKitManager {
  private state: CallKitState = {
    isInitialized: false,
    isNativeSupported: false,
    activeCallUuid: null,
    callbacks: {},
  };

  private nativeModule: any = null;

  constructor() {
    this.detectNativeModule();
  }

  private detectNativeModule(): void {
    if (Platform.OS !== 'ios') {
      this.state.isNativeSupported = false;
      return;
    }

    try {
      // Conditionally require react-native-callkeep if installed in native iOS builds
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const callkeep = require('react-native-callkeep');
      this.nativeModule = callkeep?.default || callkeep;
      this.state.isNativeSupported = !!this.nativeModule;
    } catch {
      // In Expo Go or builds without callkeep compiled, gracefully fall back
      this.nativeModule = null;
      this.state.isNativeSupported = false;
    }
  }

  /**
   * Initializes CallKit with application credentials and action callbacks.
   */
  public async initializeCallKit(
    options: Partial<CallKitOptions> = {},
    callbacks: CallKitActionCallbacks = {}
  ): Promise<boolean> {
    this.state.callbacks = { ...this.state.callbacks, ...callbacks };

    const mergedOptions: CallKitOptions = {
      ...defaultOptions,
      ...options,
    };

    if (this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.setup({
          ios: {
            appName: mergedOptions.appName,
            imageName: mergedOptions.imageName,
            ringtoneSound: mergedOptions.ringtoneSound,
            maximumCallGroups: mergedOptions.maximumCallGroups,
            maximumCallsPerCallGroup: mergedOptions.maximumCallsPerCallGroup,
            supportsVideo: mergedOptions.supportsVideo,
            includesCallsInRecents: mergedOptions.includesCallsInRecents,
          },
        });

        this.nativeModule.addEventListener('answerCall', ({ callUUID }: { callUUID: string }) => {
          this.state.activeCallUuid = callUUID;
          this.state.callbacks.onAnswerCall?.(callUUID);
        });

        this.nativeModule.addEventListener('endCall', ({ callUUID }: { callUUID: string }) => {
          if (this.state.activeCallUuid === callUUID) {
            this.state.activeCallUuid = null;
          }
          this.state.callbacks.onEndCall?.(callUUID);
        });

        this.nativeModule.addEventListener(
          'didPerformSetMutedCallAction',
          ({ muted, callUUID }: { muted: boolean; callUUID: string }) => {
            this.state.callbacks.onToggleMute?.(callUUID, muted);
          }
        );

        this.state.isInitialized = true;
        return true;
      } catch (err) {
        console.warn('[CallKit] Native CallKit setup notice:', err);
      }
    }

    // Fallback in non-native or Expo Go environments
    this.state.isInitialized = true;
    return true;
  }

  /**
   * Reports an incoming call to iOS CallKit (or fallback state).
   */
  public async reportIncomingCall(payload: IncomingCallPayload): Promise<string> {
    const { callUuid, handle, contactName, hasVideo = false } = payload;
    this.state.activeCallUuid = callUuid;

    if (this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.displayIncomingCall(
          callUuid,
          handle,
          contactName,
          'generic',
          hasVideo
        );
        return callUuid;
      } catch (err) {
        console.warn('[CallKit] Native displayIncomingCall error:', err);
      }
    }

    return callUuid;
  }

  /**
   * Registers an outgoing call in CallKit and system recents.
   */
  public async startOutgoingCall(payload: OutgoingCallPayload): Promise<string> {
    const { callUuid, handle, contactName, isVideo = false } = payload;
    this.state.activeCallUuid = callUuid;

    if (this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.startCall(callUuid, handle, contactName, 'generic', isVideo);
      } catch (err) {
        console.warn('[CallKit] Native startCall error:', err);
      }
    }

    return callUuid;
  }

  /**
   * Reports call connected/active to CallKit.
   */
  public async reportConnectedCall(callUuid?: string): Promise<void> {
    const targetUuid = callUuid || this.state.activeCallUuid;
    if (!targetUuid) return;

    if (this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.reportConnectedOutgoingCallWithUUID(targetUuid);
      } catch (err) {
        console.warn('[CallKit] Native reportConnectedCall error:', err);
      }
    }
  }

  /**
   * Ends an active CallKit session.
   */
  public async endCall(callUuid?: string): Promise<void> {
    const targetUuid = callUuid || this.state.activeCallUuid;
    if (this.state.activeCallUuid === targetUuid) {
      this.state.activeCallUuid = null;
    }

    if (targetUuid && this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.endCall(targetUuid);
      } catch (err) {
        console.warn('[CallKit] Native endCall error:', err);
      }
    }
  }

  /**
   * Synchronizes mute state with CallKit hardware indicator.
   */
  public async setMuted(muted: boolean, callUuid?: string): Promise<void> {
    const targetUuid = callUuid || this.state.activeCallUuid;
    if (targetUuid && this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.setMutedCall(targetUuid, muted);
      } catch (err) {
        console.warn('[CallKit] Native setMutedCall error:', err);
      }
    }
  }

  /**
   * Returns current CallKit manager status.
   */
  public getCallKitStatus(): { isAvailable: boolean; isNative: boolean; activeCallUuid: string | null } {
    return {
      isAvailable: this.state.isInitialized,
      isNative: this.state.isNativeSupported,
      activeCallUuid: this.state.activeCallUuid,
    };
  }
}

export const callKit = new CallKitManager();
