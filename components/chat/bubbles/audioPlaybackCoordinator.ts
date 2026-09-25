import { AudioPlayer } from 'expo-audio';

export type ActiveAudioSession = {
  messageId: string;
  player: AudioPlayer | null;
  pause: () => void;
};

let currentActiveAudioSession: ActiveAudioSession | null = null;
const audioSessionListeners = new Set<(activeMessageId: string | null) => void>();

export const registerAudioPlayback = (session: ActiveAudioSession) => {
  if (currentActiveAudioSession && currentActiveAudioSession.messageId !== session.messageId) {
    try {
      currentActiveAudioSession.pause();
    } catch {}
  }
  currentActiveAudioSession = session;
  audioSessionListeners.forEach((fn) => fn(session.messageId));
};

export const stopAudioPlayback = (messageId: string) => {
  if (currentActiveAudioSession && currentActiveAudioSession.messageId === messageId) {
    currentActiveAudioSession = null;
    audioSessionListeners.forEach((fn) => fn(null));
  }
};

export const subscribeAudioPlayback = (listener: (activeMessageId: string | null) => void) => {
  audioSessionListeners.add(listener);
  return () => {
    audioSessionListeners.delete(listener);
  };
};
