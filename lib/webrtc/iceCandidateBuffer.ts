import { RTCIceCandidatePayload } from './mediaTypes';

export class IceCandidateBuffer {
  private pendingRemoteCandidates: RTCIceCandidatePayload[] = [];
  private hasRemoteDescription = false;

  public setHasRemoteDescription(hasDesc: boolean): void {
    this.hasRemoteDescription = hasDesc;
  }

  public getHasRemoteDescription(): boolean {
    return this.hasRemoteDescription;
  }

  public async addCandidate(
    candidate: RTCIceCandidatePayload,
    peerConnection: any,
    isNative: boolean,
    nativeWebRTC: any
  ): Promise<void> {
    if (!candidate?.candidate) return;

    if (!this.hasRemoteDescription) {
      this.pendingRemoteCandidates.push(candidate);
      return;
    }

    try {
      if (isNative && nativeWebRTC?.RTCIceCandidate) {
        const rtcCandidate = new nativeWebRTC.RTCIceCandidate(candidate);
        await peerConnection?.addIceCandidate?.(rtcCandidate);
      } else {
        await peerConnection?.addIceCandidate?.(candidate);
      }
    } catch (err) {
      console.warn('[MediaEngine] Failed to apply remote ICE candidate:', err);
    }
  }

  public async flush(
    peerConnection: any,
    isNative: boolean,
    nativeWebRTC: any
  ): Promise<void> {
    if (this.pendingRemoteCandidates.length === 0) return;

    const candidates = [...this.pendingRemoteCandidates];
    this.pendingRemoteCandidates = [];

    for (const cand of candidates) {
      try {
        if (isNative && nativeWebRTC?.RTCIceCandidate) {
          const rtcCand = new nativeWebRTC.RTCIceCandidate(cand);
          await peerConnection?.addIceCandidate?.(rtcCand);
        } else {
          await peerConnection?.addIceCandidate?.(cand);
        }
      } catch (err) {
        console.warn('[MediaEngine] Error flushing buffered ICE candidate:', err);
      }
    }
  }

  public clear(): void {
    this.pendingRemoteCandidates = [];
    this.hasRemoteDescription = false;
  }
}
