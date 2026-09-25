import { Platform } from 'react-native';
import {
  CallKitOptions, IncomingCallPayload, OutgoingCallPayload,
  CallKitActionCallbacks, CallKitState, defaultCallKitOptions,
} from './callkitTypes';
import { attachCallKitEventListeners } from './callkitEvents';

export * from './callkitTypes';

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

  public detectNativeModule(): void {
    if (Platform.OS !== 'ios') {
      this.state.isNativeSupported = false;
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const callkeep = require('react-native-callkeep');
      this.nativeModule = callkeep?.default || callkeep;
      this.state.isNativeSupported = !!this.nativeModule;
    } catch {
      this.nativeModule = null;
      this.state.isNativeSupported = false;
    }
  }

  public async initializeCallKit(
    options: Partial<CallKitOptions> = {},
    callbacks: CallKitActionCallbacks = {}
  ): Promise<boolean> {
    this.state.callbacks = { ...this.state.callbacks, ...callbacks };
    const mergedOptions: CallKitOptions = { ...defaultCallKitOptions, ...options };

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

        attachCallKitEventListeners(this.nativeModule, this.state);
        this.state.isInitialized = true;
        return true;
      } catch (err) {
        console.warn('[CallKit] Native CallKit setup notice:', err);
      }
    }

    this.state.isInitialized = true;
    return true;
  }

  public async reportIncomingCall(payload: IncomingCallPayload): Promise<string> {
    const { callUuid, handle, contactName, hasVideo = false } = payload;
    this.state.activeCallUuid = callUuid;

    if (this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.displayIncomingCall(callUuid, handle, contactName, 'generic', hasVideo);
      } catch (err) {
        console.warn('[CallKit] Native displayIncomingCall error:', err);
      }
    }
    return callUuid;
  }

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

  public async endCall(callUuid?: string): Promise<void> {
    const targetUuid = callUuid || this.state.activeCallUuid;
    if (this.state.activeCallUuid === targetUuid) this.state.activeCallUuid = null;

    if (targetUuid && this.state.isNativeSupported && this.nativeModule) {
      try {
        await this.nativeModule.endCall(targetUuid);
      } catch (err) {
        console.warn('[CallKit] Native endCall error:', err);
      }
    }
  }

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

  public getCallKitStatus(): { isAvailable: boolean; isNative: boolean; activeCallUuid: string | null } {
    return {
      isAvailable: this.state.isInitialized,
      isNative: this.state.isNativeSupported,
      activeCallUuid: this.state.activeCallUuid,
    };
  }
}

export const callKit = new CallKitManager();
