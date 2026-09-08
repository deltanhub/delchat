import { setAudioModeAsync } from 'expo-audio';

export type AudioRoute = 'earpiece' | 'speaker' | 'bluetooth';

let _currentAudioRoute: AudioRoute = 'earpiece';

let inCallManager: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const incall = require('react-native-incall-manager');
  inCallManager = incall?.default || incall;
} catch {
  inCallManager = null;
}

/**
 * Query the currently active audio route.
 */
export function getCurrentAudioRoute(): AudioRoute {
  return _currentAudioRoute;
}

/**
 * Route hardware audio to earpiece, speaker, or bluetooth.
 */
export async function setAudioRoute(route: AudioRoute): Promise<void> {
  _currentAudioRoute = route;

  // 1. Native InCallManager hardware bridge (for native builds)
  if (inCallManager) {
    try {
      const isSpeaker = route === 'speaker';
      inCallManager.setSpeakerphoneOn(isSpeaker);
      if (typeof inCallManager.setForceSpeakerphoneOn === 'function') {
        inCallManager.setForceSpeakerphoneOn(isSpeaker);
      }
      if (route === 'bluetooth' && typeof inCallManager.chooseAudioRoute === 'function') {
        inCallManager.chooseAudioRoute('BLUETOOTH');
      } else if (route === 'earpiece' && typeof inCallManager.chooseAudioRoute === 'function') {
        inCallManager.chooseAudioRoute('EARPIECE');
      } else if (route === 'speaker' && typeof inCallManager.chooseAudioRoute === 'function') {
        inCallManager.chooseAudioRoute('SPEAKER_PHONE');
      }
    } catch (err) {
      console.warn('[WebRTC Audio] InCallManager hardware route error:', err);
    }
  }

  // 2. Expo Audio hardware session configuration
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: route === 'earpiece',
    });
  } catch (err) {
    console.warn('[WebRTC Audio] Failed to switch audio output route to', route, err);
  }
}

/**
 * Configure mobile device hardware audio session for VoIP calling.
 * Handles background audio execution, silent mode bypass, and dynamic earpiece vs. speaker routing.
 */
export async function configureAudioForCall(options: { isSpeakerOn?: boolean; route?: AudioRoute } = { isSpeakerOn: false }): Promise<void> {
  const targetRoute: AudioRoute = options.route || (options.isSpeakerOn ? 'speaker' : 'earpiece');

  if (inCallManager) {
    try {
      inCallManager.start({ media: options.isSpeakerOn ? 'video' : 'audio', auto: false });
    } catch (err) {
      console.warn('[WebRTC Audio] InCallManager start error:', err);
    }
  }

  await setAudioRoute(targetRoute);
}

/**
 * Update audio routing dynamically during an active call (Speakerphone toggle).
 */
export async function setSpeakerphone(isSpeakerOn: boolean): Promise<void> {
  await setAudioRoute(isSpeakerOn ? 'speaker' : 'earpiece');
}

/**
 * Reset device audio session to standard playback upon call termination.
 */
export async function resetAudioAfterCall(): Promise<void> {
  _currentAudioRoute = 'earpiece';

  if (inCallManager) {
    try {
      inCallManager.stop();
    } catch (err) {
      console.warn('[WebRTC Audio] InCallManager stop error:', err);
    }
  }

  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      shouldRouteThroughEarpiece: false,
    });
  } catch (err) {
    console.warn('[WebRTC Audio] Failed to reset audio mode:', err);
  }
}
