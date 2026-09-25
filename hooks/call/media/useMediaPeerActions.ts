import { useCallback } from 'react';
import {
  WebRTCMediaEngine,
  RTCIceCandidatePayload,
  RTCSessionDescriptionPayload,
} from '../../../lib/webrtc/mediaEngine';

export interface UseMediaPeerActionsParams {
  engineRef: React.MutableRefObject<WebRTCMediaEngine | null>;
  isFrontCamera: boolean;
  setIsFrontCamera: React.Dispatch<React.SetStateAction<boolean>>;
  setLocalStream: (stream: any) => void;
  setRemoteStream: (stream: any) => void;
}

export function useMediaPeerActions({
  engineRef,
  isFrontCamera,
  setIsFrontCamera,
  setLocalStream,
  setRemoteStream,
}: UseMediaPeerActionsParams) {
  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionPayload | null> => {
    if (!engineRef.current) return null;
    try {
      return await engineRef.current.createOffer();
    } catch (err) {
      console.warn('[useCallMedia] Failed to create offer:', err);
      return null;
    }
  }, [engineRef]);

  const handleOfferAndCreateAnswer = useCallback(
    async (sdp: string): Promise<RTCSessionDescriptionPayload | null> => {
      if (!engineRef.current) return null;
      try {
        return await engineRef.current.handleRemoteOfferAndCreateAnswer(sdp);
      } catch (err) {
        console.warn('[useCallMedia] Failed to handle offer and create answer:', err);
        return null;
      }
    },
    [engineRef]
  );

  const handleAnswer = useCallback(async (sdp: string): Promise<void> => {
    if (!engineRef.current) return;
    try {
      await engineRef.current.handleRemoteAnswer(sdp);
    } catch (err) {
      console.warn('[useCallMedia] Failed to handle answer:', err);
    }
  }, [engineRef]);

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidatePayload): Promise<void> => {
      if (!engineRef.current) return;
      try {
        await engineRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[useCallMedia] Failed to add ICE candidate:', err);
      }
    },
    [engineRef]
  );

  const switchCamera = useCallback(async (): Promise<void> => {
    if (!engineRef.current) return;
    try {
      await engineRef.current.switchCamera();
      setIsFrontCamera((prev) => !prev);
    } catch (err) {
      console.warn('[useCallMedia] Failed to switch camera:', err);
    }
  }, [engineRef, setIsFrontCamera]);

  const upgradeToVideo = useCallback(async (): Promise<any> => {
    if (!engineRef.current) return null;
    try {
      const updatedStream = await engineRef.current.upgradeToVideoMedia(
        isFrontCamera ? 'user' : 'environment'
      );
      if (updatedStream) setLocalStream(updatedStream);
      return updatedStream;
    } catch (err) {
      console.warn('[useCallMedia] Failed to upgrade to video:', err);
      return null;
    }
  }, [engineRef, isFrontCamera, setLocalStream]);

  const setMuted = useCallback((isMuted: boolean): void => {
    engineRef.current?.setAudioMuted(isMuted);
  }, [engineRef]);

  const setVideoMuted = useCallback((isVideoMuted: boolean): void => {
    engineRef.current?.setVideoMuted(isVideoMuted);
  }, [engineRef]);

  const cleanupMedia = useCallback((): void => {
    if (engineRef.current) {
      engineRef.current.close();
      engineRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
  }, [engineRef, setLocalStream, setRemoteStream]);

  return {
    createOffer,
    handleOfferAndCreateAnswer,
    handleAnswer,
    addIceCandidate,
    switchCamera,
    upgradeToVideo,
    setMuted,
    setVideoMuted,
    cleanupMedia,
  };
}
