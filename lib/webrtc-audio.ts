import { setAudioModeAsync } from 'expo-audio';

export type AudioRoute = 'earpiece' | 'speaker' | 'bluetooth';

let _currentAudioRoute: AudioRoute = 'earpiece';

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

