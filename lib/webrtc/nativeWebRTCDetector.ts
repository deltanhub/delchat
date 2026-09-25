import { Platform } from 'react-native';

export function detectNativeWebRTC(): { isAvailable: boolean; nativeWebRTC: any } {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'RTCPeerConnection' in window) {
      return {
        isAvailable: true,
        nativeWebRTC: {
          RTCPeerConnection: (window as any).RTCPeerConnection,
          RTCIceCandidate: (window as any).RTCIceCandidate,
          RTCSessionDescription: (window as any).RTCSessionDescription,
          mediaDevices: navigator?.mediaDevices,
        },
      };
    }
    return { isAvailable: false, nativeWebRTC: null };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webrtcModule = require('react-native-webrtc');
    if (webrtcModule?.RTCPeerConnection) {
      return { isAvailable: true, nativeWebRTC: webrtcModule };
    }
  } catch {
    // Graceful fallback for Expo Go and sandbox runners
  }
  return { isAvailable: false, nativeWebRTC: null };
}
