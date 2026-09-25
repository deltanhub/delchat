import { useState, useRef, useCallback, useEffect } from 'react';
import { WebRTCMediaEngine } from '../../../lib/webrtc/mediaEngine';
import { fetchIceConfig } from '../../../lib/webrtc-signaling';
import { UseCallMediaOptions, ConnectionHealth } from './types';

export function useMediaEngineInit(options: UseCallMediaOptions = {}) {
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>('connected');
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const engineRef = useRef<WebRTCMediaEngine | null>(null);
  const callbacksRef = useRef(options);

  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const initMedia = useCallback(async (kind: 'audio' | 'video') => {
    try {
      const iceConfig = await fetchIceConfig();
      const engine = new WebRTCMediaEngine({
        iceServers: iceConfig.iceServers,
        onLocalIceCandidate: (candidate) => {
          callbacksRef.current.onLocalCandidate?.(candidate);
        },
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setConnectionHealth('connected');
          } else if (state === 'disconnected') {
            setConnectionHealth('reconnecting');
          } else if (state === 'failed') {
            setConnectionHealth('failed');
          }
        },
        onIceRestartNeeded: (offer) => {
          callbacksRef.current.onIceRestartNeeded?.(offer);
        },
      });

      engineRef.current = engine;

      const acquiredStream = await engine.acquireLocalMedia({
        audio: true,
        video: kind === 'video',
        facingMode: 'user',
      });

      setLocalStream(acquiredStream);
      return acquiredStream;
    } catch (err) {
      console.warn('[useCallMedia] Media acquisition failed:', err);
      return null;
    }
  }, []);

  return {
    engineRef,
    localStream,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    connectionHealth,
    isFrontCamera,
    setIsFrontCamera,
    initMedia,
  };
}
