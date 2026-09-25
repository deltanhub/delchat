import { MediaEngineConfig, WebRTCConnectionState } from './mediaTypes';
import { createSimulatedPeerConnection } from './simulatedPeerConnection';

export function createConfiguredPeerConnection(
  config: MediaEngineConfig,
  isNative: boolean,
  nativeWebRTC: any,
  onRemoteStream: (stream: any) => void,
  onStateChange: (state: WebRTCConnectionState) => void
): any {
  const rtcConfig = {
    iceServers: config.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }],
    iceCandidatePoolSize: 2,
  };

  if (isNative && nativeWebRTC?.RTCPeerConnection) {
    try {
      const PC = nativeWebRTC.RTCPeerConnection;
      const pc = new PC(rtcConfig);
      pc.onicecandidate = (e: any) => {
        if (e?.candidate) {
          config.onLocalIceCandidate?.({
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
            usernameFragment: e.candidate.usernameFragment,
          });
        }
      };
      pc.ontrack = (e: any) => {
        let stream = e.streams?.[0];
        if (!stream && e.track) {
          try {
            const MediaStreamClass = nativeWebRTC?.MediaStream || (typeof MediaStream !== 'undefined' ? MediaStream : null);
            if (MediaStreamClass) {
              stream = new MediaStreamClass([e.track]);
            }
          } catch {}
        }
        if (stream) {
          onRemoteStream(stream);
          config.onRemoteStream?.(stream);
        }
      };
      pc.onconnectionstatechange = () => {
        const s = (pc.connectionState as WebRTCConnectionState) || 'connected';
        onStateChange(s);
      };
      pc.onicegatheringstatechange = () => {
        config.onIceGatheringStateChange?.(pc.iceGatheringState);
      };
      return pc;
    } catch (err) {
      console.warn('[MediaEngine] Init error:', err);
    }
  }
  return createSimulatedPeerConnection();
}
