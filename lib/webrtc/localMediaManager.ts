import { MediaAcquisitionOptions } from './mediaTypes';
import { createSimulatedLocalStream } from './simulatedPeerConnection';

export async function acquireLocalMediaStream(
  options: MediaAcquisitionOptions = { audio: true, video: false },
  isNative: boolean,
  nativeWebRTC: any,
  peerConnection: any
): Promise<any> {
  const { audio = true, video = false, facingMode = 'user' } = options;

  if (isNative && nativeWebRTC?.mediaDevices?.getUserMedia) {
    try {
      const constraints = {
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: video
          ? {
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
      };

      const stream = await nativeWebRTC.mediaDevices.getUserMedia(constraints);
      if (peerConnection?.addTrack) {
        stream.getTracks().forEach((track: any) => {
          try {
            peerConnection.addTrack(track, stream);
          } catch {}
        });
      }
      return stream;
    } catch (err) {
      console.warn('[MediaEngine] Error capturing local media stream:', err);
    }
  }

  return createSimulatedLocalStream(video);
}

export async function upgradeToVideoMediaStream(
  facingMode: 'user' | 'environment' = 'user',
  localStream: any,
  isNative: boolean,
  nativeWebRTC: any,
  peerConnection: any
): Promise<any> {
  if (isNative && nativeWebRTC?.mediaDevices?.getUserMedia) {
    try {
      const videoConstraints = {
        audio: false,
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      };
      const videoOnlyStream = await nativeWebRTC.mediaDevices.getUserMedia(videoConstraints);
      const videoTracks = videoOnlyStream.getVideoTracks();

      if (videoTracks.length > 0 && localStream) {
        const newVideoTrack = videoTracks[0];
        if (typeof localStream.addTrack === 'function') {
          localStream.addTrack(newVideoTrack);
        }
        if (peerConnection?.addTrack) {
          try {
            peerConnection.addTrack(newVideoTrack, localStream);
          } catch {}
        }
      }
      return localStream;
    } catch (err) {
      console.warn('[MediaEngine] Error upgrading to video stream:', err);
    }
  }

  const newVideoTrack = { kind: 'video', enabled: true, stop: () => {} };
  if (localStream) {
    const existingAudio = localStream.getAudioTracks ? localStream.getAudioTracks() : [{ kind: 'audio', enabled: true, stop: () => {} }];
    localStream.getTracks = () => [...existingAudio, newVideoTrack];
    localStream.getVideoTracks = () => [newVideoTrack];
  }
  return localStream;
}

export function setAudioTrackMuted(localStream: any, muted: boolean): void {
  localStream?.getAudioTracks?.()?.forEach((track: any) => {
    track.enabled = !muted;
  });
}

export function setVideoTrackMuted(localStream: any, muted: boolean): void {
  localStream?.getVideoTracks?.()?.forEach((track: any) => {
    track.enabled = !muted;
  });
}

export function switchCameraFacing(localStream: any): void {
  localStream?.getVideoTracks?.()?.forEach((track: any) => {
    if (typeof track._switchCamera === 'function') {
      track._switchCamera();
    }
  });
}

export function stopLocalMediaTracks(localStream: any): void {
  localStream?.getTracks?.()?.forEach((track: any) => {
    try {
      track.stop();
    } catch {}
  });
}
