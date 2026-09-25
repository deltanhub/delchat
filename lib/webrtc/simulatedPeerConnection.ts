import { RTCSessionDescriptionPayload } from './mediaTypes';

export function createSimulatedPeerConnection(): any {
  return {
    connectionState: 'new',
    iceGatheringState: 'new',
    addTrack: () => {},
    addIceCandidate: async () => {},
    restartIce: () => {},
    createOffer: async (options?: any): Promise<RTCSessionDescriptionPayload> => ({
      type: 'offer',
      sdp: options?.iceRestart
        ? 'v=0\r\no=- 123456 3 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=sendrecv\r\na=ice-options:restart\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=rtpmap:111 opus/48000/2\r\n'
        : 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=sendrecv\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=rtpmap:111 opus/48000/2\r\n',
    }),
    createAnswer: async (): Promise<RTCSessionDescriptionPayload> => ({
      type: 'answer',
      sdp: 'v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=sendrecv\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=rtpmap:111 opus/48000/2\r\n',
    }),
    setLocalDescription: async (desc: any) => desc,
    setRemoteDescription: async (desc: any) => desc,
    close: () => {},
  };
}

export function createSimulatedLocalStream(video = false): any {
  return {
    id: `local_stream_${Date.now()}`,
    active: true,
    getTracks: () => [
      { kind: 'audio', enabled: true, stop: () => {} },
      ...(video ? [{ kind: 'video', enabled: true, stop: () => {} }] : []),
    ],
    getAudioTracks: () => [{ kind: 'audio', enabled: true, stop: () => {} }],
    getVideoTracks: () => (video ? [{ kind: 'video', enabled: true, stop: () => {} }] : []),
  };
}
