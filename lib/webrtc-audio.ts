import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

/**
 * Configure mobile device hardware audio session for VoIP calling.
 * Handles background audio execution, silent mode bypass, and dynamic earpiece vs. speaker routing.
 */
export async function configureAudioForCall(options: { isSpeakerOn: boolean } = { isSpeakerOn: false }): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: !options.isSpeakerOn,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: !options.isSpeakerOn,
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
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: !isSpeakerOn,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: !isSpeakerOn,
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
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (err) {
    console.warn('[WebRTC Audio] Failed to reset audio mode:', err);
  }
}
