import { useState, useCallback, useEffect } from 'react';
import {
  configureAudioForCall,
  setSpeakerphone,
  setAudioRoute,
  resetAudioAfterCall,
  getCurrentAudioRoute,
  AudioRoute,
} from '../../lib/webrtc-audio';
import { proximityService } from '../../lib/voip/proximityService';
import { callRingtoneService } from '../../lib/voip/callRingtoneService';

export interface UseCallAudioGovernanceOptions {
  callKind: 'audio' | 'video';
  callPhase: 'outgoing' | 'incoming' | 'connected' | 'ended';
}

export interface UseCallAudioGovernanceReturn {
  isSpeakerOn: boolean;
  audioRoute: AudioRoute;
  toggleSpeaker: () => void;
  selectAudioRoute: (route: AudioRoute) => void;
  playOutgoingRingback: () => void;
  playIncomingRingtone: () => void;
  stopRingtones: () => void;
  setupAudioForConnectedCall: (kind: 'audio' | 'video') => void;
  cleanupAudio: () => void;
}

/**
 * Single-responsibility hook managing hardware loudspeaker routing,
 * Expo audio session modes, ringtone service, and proximity sensor synchronization.
 */
export function useCallAudioGovernance({
  callKind,
  callPhase,
}: UseCallAudioGovernanceOptions): UseCallAudioGovernanceReturn {
  const [isSpeakerOn, setIsSpeakerOn] = useState(callKind === 'video');
  const [audioRoute, setAudioRouteState] = useState<AudioRoute>(
    callKind === 'video' ? 'speaker' : 'earpiece'
  );

  // Synchronize proximity sensor with route and call kind
  useEffect(() => {
    if (callPhase === 'connected') {
      if (callKind === 'audio' && audioRoute === 'earpiece') {
        proximityService.enableProximity();
      } else {
        proximityService.disableProximity();
      }
    } else {
      proximityService.disableProximity();
    }
  }, [callPhase, callKind, audioRoute]);

  const toggleSpeaker = useCallback(() => {
    const nextSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(nextSpeakerState);
    setSpeakerphone(nextSpeakerState);
    const nextRoute = nextSpeakerState ? 'speaker' : 'earpiece';
    setAudioRouteState(nextRoute);
  }, [isSpeakerOn]);

  const selectAudioRoute = useCallback((route: AudioRoute) => {
    setAudioRouteState(route);
    setAudioRoute(route);
    setIsSpeakerOn(route === 'speaker');
  }, []);

  const playOutgoingRingback = useCallback(() => {
    void callRingtoneService.playOutgoingRingback();
  }, []);

  const playIncomingRingtone = useCallback(() => {
    void callRingtoneService.playIncomingRingtone();
  }, []);

  const stopRingtones = useCallback(() => {
    void callRingtoneService.stopAllRingtones();
  }, []);

  const setupAudioForConnectedCall = useCallback((kind: 'audio' | 'video') => {
    void callRingtoneService.stopAllRingtones();
    const useSpeaker = kind === 'video';
    setIsSpeakerOn(useSpeaker);
    setAudioRouteState(useSpeaker ? 'speaker' : 'earpiece');
    void configureAudioForCall({ isSpeakerOn: useSpeaker });
  }, []);

  const cleanupAudio = useCallback(() => {
    void callRingtoneService.stopAllRingtones();
    proximityService.disableProximity();
    void resetAudioAfterCall();
    setIsSpeakerOn(false);
    setAudioRouteState('earpiece');
  }, []);

  return {
    isSpeakerOn,
    audioRoute,
    toggleSpeaker,
    selectAudioRoute,
    playOutgoingRingback,
    playIncomingRingtone,
    stopRingtones,
    setupAudioForConnectedCall,
    cleanupAudio,
  };
}
