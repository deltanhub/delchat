import type { CallKitState } from './callkitTypes';

export function attachCallKitEventListeners(nativeModule: any, state: CallKitState): void {
  if (!nativeModule?.addEventListener) return;

  nativeModule.addEventListener('answerCall', ({ callUUID }: { callUUID: string }) => {
    state.activeCallUuid = callUUID;
    state.callbacks.onAnswerCall?.(callUUID);
  });

  nativeModule.addEventListener('endCall', ({ callUUID }: { callUUID: string }) => {
    if (state.activeCallUuid === callUUID) {
      state.activeCallUuid = null;
    }
    state.callbacks.onEndCall?.(callUUID);
  });

  nativeModule.addEventListener(
    'didPerformSetMutedCallAction',
    ({ muted, callUUID }: { muted: boolean; callUUID: string }) => {
      state.callbacks.onToggleMute?.(callUUID, muted);
    }
  );
}
