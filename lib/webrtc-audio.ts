import { setAudioModeAsync } from 'expo-audio';

/**
 * Configure mobile device hardware audio session for VoIP calling.
 * Handles background audio execution, silent mode bypass, and dynamic earpiece vs. speaker routing.
 */
export async function configureAudioForCall(options: { isSpeakerOn: boolean } = { isSpeakerOn: false }): Promise<void> {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: !options.isSpeakerOn,
    });
  } catch (err) {
    console.warn('[WebRTC Audio] Failed to set VoIP audio mode:', err);
  }
}

/**
 * Update audio routing dynamically during an active call (Speakerphone toggle).
 */
export async function setSpeakerphone(isSpeakerOn: boolean): Promise<void> {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: !isSpeakerOn,
    });
  } catch (err) {
    console.warn('[WebRTC Audio] Failed to switch audio output route:', err);
  }
}

/**
 * Reset device audio session to standard playback upon call termination.
 */
export async function resetAudioAfterCall(): Promise<void> {
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
