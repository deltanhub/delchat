import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

// Dynamic sound asset references
const RINGBACK_SOUND = require('../../assets/sounds/ringback.wav');
const INCOMING_SOUND = require('../../assets/sounds/incoming_ring.wav');

export type RingtoneMode = 'idle' | 'outgoing_ringback' | 'incoming_ring';

/**
 * Service managing in-call audible ringtones and ringback tones.
 * Uses Expo SDK 57 expo-audio for seamless background audio and silent mode bypass.
 */
class CallRingtoneService {
  private activePlayer: AudioPlayer | null = null;
  private currentMode: RingtoneMode = 'idle';
  private isProcessing = false;

  /**
   * Get the current active ringtone mode.
   */
  public getMode(): RingtoneMode {
    return this.currentMode;
  }

  /**
   * Play standard outgoing ringback tone ("tuuuut... tuuuut...") for call initiator.
   */
  public async playOutgoingRingback(): Promise<void> {
    if (this.currentMode === 'outgoing_ringback') return;
    await this.stopAllRingtones();

    this.currentMode = 'outgoing_ringback';
    this.isProcessing = true;

    try {
      // Configure audio mode for phone call ringback
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: true,
      }).catch(() => {});

      const player = createAudioPlayer(RINGBACK_SOUND, { updateInterval: 500 });
      player.loop = true;
      player.play();

      this.activePlayer = player;
    } catch (err) {
      console.warn('[CallRingtoneService] Failed to play outgoing ringback:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Play melodic incoming call ringtone for recipient.
   */
  public async playIncomingRingtone(): Promise<void> {
    if (this.currentMode === 'incoming_ring') return;
    await this.stopAllRingtones();

    this.currentMode = 'incoming_ring';
    this.isProcessing = true;

    try {
      // Configure audio mode for loudspeaker incoming call alerting
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: false,
      }).catch(() => {});

      const player = createAudioPlayer(INCOMING_SOUND, { updateInterval: 500 });
      player.loop = true;
      player.play();

      this.activePlayer = player;
    } catch (err) {
      console.warn('[CallRingtoneService] Failed to play incoming ringtone:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Immediately and cleanly stop all active ringtones/ringback tones.
   * Idempotent: safe to call repeatedly from any lifecycle hook or unmount.
   */
  public async stopAllRingtones(): Promise<void> {
    this.currentMode = 'idle';

    if (this.activePlayer) {
      const playerToStop = this.activePlayer;
      this.activePlayer = null;

      try {
        playerToStop.pause();
        if (typeof playerToStop.release === 'function') {
          playerToStop.release();
        }
      } catch (err) {
        console.warn('[CallRingtoneService] Error releasing ringtone player:', err);
      }
    }
  }
}

export const callRingtoneService = new CallRingtoneService();
export { CallRingtoneService };
