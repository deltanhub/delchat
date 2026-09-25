import { ChatCallSignal } from '../../../lib/webrtc-signaling';
import { UseCallSignalingOptions } from './types';

export function routeIncomingCallSignal(
  sig: ChatCallSignal | null | undefined,
  currentUserId: string,
  callbacks: UseCallSignalingOptions
): void {
  if (!sig || sig.senderUserId === currentUserId) return;

  switch (sig.signalType) {
    case 'offer':
      if (sig.payload?.sdp) {
        callbacks.onOffer?.(sig.payload.sdp, Boolean(sig.payload.isIceRestart));
      }
      break;
    case 'answer':
      if (sig.payload?.sdp) {
        callbacks.onAnswer?.(sig.payload.sdp);
      }
      break;
    case 'ice-candidate':
      if (sig.payload?.candidate) {
        callbacks.onIceCandidate?.(sig.payload);
      }
      break;
    case 'hangup':
      callbacks.onHangup?.(sig.payload?.reason);
      break;
    case 'media-state':
      callbacks.onMediaState?.({
        isMuted: typeof sig.payload?.isMuted === 'boolean' ? sig.payload.isMuted : undefined,
        isVideoOff: typeof sig.payload?.isVideoOff === 'boolean' ? sig.payload.isVideoOff : undefined,
      });
      break;
    case 'upgrade-to-video':
      callbacks.onUpgradeToVideo?.();
      break;
    case 'downgrade-to-audio':
      callbacks.onDowngradeToAudio?.();
      break;
    case 'receiver-ready':
      callbacks.onReceiverReady?.();
      break;
  }
}
