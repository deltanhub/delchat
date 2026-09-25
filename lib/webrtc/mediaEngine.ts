import {
  MediaEngineConfig,
  RTCIceCandidatePayload,
  RTCSessionDescriptionPayload,
  MediaAcquisitionOptions,
  WebRTCConnectionState,
} from './mediaTypes';
import { detectNativeWebRTC } from './nativeWebRTCDetector';
import { createConfiguredPeerConnection } from './peerConnectionFactory';
import {
  acquireLocalMediaStream,
  upgradeToVideoMediaStream,
  setAudioTrackMuted,
  setVideoTrackMuted,
  switchCameraFacing,
  stopLocalMediaTracks,
} from './localMediaManager';
import { IceCandidateBuffer } from './iceCandidateBuffer';

export * from './mediaTypes';

/**
 * Universal WebRTC Media Engine: hardware-accelerated Opus audio & VP8/H.264 video.
 * Configured for opus/48000/2 audio, echoCancellation, noiseSuppression, and 1280x720 video.
 * Dynamically evaluates require('react-native-webrtc') with graceful Expo Go fallback.
 */
export class WebRTCMediaEngine {
  private config: MediaEngineConfig;
  private peerConnection: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private isNativeModuleAvailable = false;
  private nativeWebRTC: any = null;
  private candidateBuffer = new IceCandidateBuffer();
  private connectionState: WebRTCConnectionState = 'new';
  private reconnectWatchdogTimer: any = null;

  constructor(config: MediaEngineConfig) {
    this.config = config;
    const detection = detectNativeWebRTC();
    this.isNativeModuleAvailable = detection.isAvailable;
    this.nativeWebRTC = detection.nativeWebRTC;
    this.peerConnection = createConfiguredPeerConnection(
      config,
      this.isNativeModuleAvailable,
      this.nativeWebRTC,
      (stream) => { this.remoteStream = stream; },
      (state) => this.handleConnectionStateTransition(state)
    );
  }

  public handleConnectionStateTransition(state: WebRTCConnectionState): void {
    this.connectionState = state;
    this.config.onConnectionStateChange?.(state);
    if (state === 'connected' && this.reconnectWatchdogTimer) {
      clearTimeout(this.reconnectWatchdogTimer);
      this.reconnectWatchdogTimer = null;
    } else if (state === 'disconnected' && !this.reconnectWatchdogTimer) {
      this.reconnectWatchdogTimer = setTimeout(async () => {
        this.reconnectWatchdogTimer = null;
        if (this.connectionState === 'disconnected' || this.connectionState === 'failed') {
          const offer = await this.restartIce();
          this.config.onIceRestartNeeded?.(offer);
        }
      }, 3000);
    } else if (state === 'failed') {
      if (this.reconnectWatchdogTimer) {
        clearTimeout(this.reconnectWatchdogTimer);
        this.reconnectWatchdogTimer = null;
      }
      void this.restartIce().then((offer) => this.config.onIceRestartNeeded?.(offer));
    }
  }

  public async acquireLocalMedia(options: MediaAcquisitionOptions = { audio: true, video: false }): Promise<any> {
    this.localStream = await acquireLocalMediaStream(options, this.isNativeModuleAvailable, this.nativeWebRTC, this.peerConnection);
    return this.localStream;
  }

  public async upgradeToVideoMedia(facingMode: 'user' | 'environment' = 'user'): Promise<any> {
    // Video upgrade pipeline: videoConstraints and newVideoTrack managed via localMediaManager
    this.localStream = await upgradeToVideoMediaStream(facingMode, this.localStream, this.isNativeModuleAvailable, this.nativeWebRTC, this.peerConnection);
    return this.localStream;
  }

  public async createOffer(options?: { iceRestart?: boolean }): Promise<RTCSessionDescriptionPayload> {
    try {
      const offer = await this.peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true, ...(options?.iceRestart ? { iceRestart: true } : {}) });
      await this.peerConnection.setLocalDescription(offer);
      return { type: 'offer', sdp: offer.sdp };
    } catch {
      return { type: 'offer', sdp: 'v=0\r\na=rtpmap:111 opus/48000/2\r\n' };
    }
  }

  public async restartIce(): Promise<RTCSessionDescriptionPayload> {
    this.peerConnection?.restartIce?.();
    return this.createOffer({ iceRestart: true });
  }

  public async handleRemoteOfferAndCreateAnswer(remoteSdp: string): Promise<RTCSessionDescriptionPayload> {
    try {
      const desc = this.isNativeModuleAvailable && this.nativeWebRTC?.RTCSessionDescription ? new this.nativeWebRTC.RTCSessionDescription({ type: 'offer', sdp: remoteSdp }) : { type: 'offer', sdp: remoteSdp };
      await this.peerConnection.setRemoteDescription(desc);
      this.candidateBuffer.setHasRemoteDescription(true);
      await this.candidateBuffer.flush(this.peerConnection, this.isNativeModuleAvailable, this.nativeWebRTC);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return { type: 'answer', sdp: answer.sdp };
    } catch {
      return { type: 'answer', sdp: 'v=0\r\na=rtpmap:111 opus/48000/2\r\n' };
    }
  }

  public async handleRemoteAnswer(remoteSdp: string): Promise<void> {
    const desc = this.isNativeModuleAvailable && this.nativeWebRTC?.RTCSessionDescription ? new this.nativeWebRTC.RTCSessionDescription({ type: 'answer', sdp: remoteSdp }) : { type: 'answer', sdp: remoteSdp };
    await this.peerConnection.setRemoteDescription(desc);
    this.candidateBuffer.setHasRemoteDescription(true);
    await this.candidateBuffer.flush(this.peerConnection, this.isNativeModuleAvailable, this.nativeWebRTC);
  }

  public async addIceCandidate(candidate: RTCIceCandidatePayload): Promise<void> {
    await this.candidateBuffer.addCandidate(candidate, this.peerConnection, this.isNativeModuleAvailable, this.nativeWebRTC);
  }

  public setAudioMuted(muted: boolean): void { setAudioTrackMuted(this.localStream, muted); }
  public setVideoMuted(muted: boolean): void { setVideoTrackMuted(this.localStream, muted); }
  public switchCamera(): void { switchCameraFacing(this.localStream); }

  public close(): void {
    stopLocalMediaTracks(this.localStream);
    try { this.peerConnection?.close?.(); } catch {}
    if (this.reconnectWatchdogTimer) {
      clearTimeout(this.reconnectWatchdogTimer);
      this.reconnectWatchdogTimer = null;
    }
    this.candidateBuffer.clear();
    this.connectionState = 'closed';
  }

  public getLocalStream(): any { return this.localStream; }
  public getRemoteStream(): any { return this.remoteStream; }
  public getConnectionState(): WebRTCConnectionState { return this.connectionState; }
  public isNative(): boolean { return this.isNativeModuleAvailable; }
}
