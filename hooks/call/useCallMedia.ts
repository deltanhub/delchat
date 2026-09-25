import {
  UseCallMediaOptions,
  UseCallMediaReturn,
  useMediaEngineInit,
  useMediaPeerActions,
} from './media';

export * from './media/types';

/**
 * Single-responsibility hook managing WebRTC media stream acquisition,
 * track governance, camera switching (switchCamera), and HD video upgrades (upgradeToVideo).
 */
export function useCallMedia(options: UseCallMediaOptions = {}): UseCallMediaReturn {
  const {
    engineRef,
    localStream,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    connectionHealth,
    isFrontCamera,
    setIsFrontCamera,
    initMedia,
  } = useMediaEngineInit(options);

  const peerActions = useMediaPeerActions({
    engineRef,
    isFrontCamera,
    setIsFrontCamera,
    setLocalStream,
    setRemoteStream,
  });

  return {
    localStream,
    remoteStream,
    connectionHealth,
    isFrontCamera,
    initMedia,
    ...peerActions,
  };
}
