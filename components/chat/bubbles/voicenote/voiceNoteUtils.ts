import { ChatMessage } from '../types';

export const formatAudioTime = (secs: number): string => {
  const total = Math.floor(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const resolveVoiceNoteDuration = (message: ChatMessage): number => {
  const rawDuration =
    message.structuredPayload?.voiceNote?.durationSeconds ||
    message.voice_note_duration_seconds ||
    3;
  return Math.max(1, Number(rawDuration) || 3);
};

export const resolveVoiceNoteAudioUri = (message: ChatMessage): string | null => {
  return (
    message.structuredPayload?.voiceNote?.audioUrl ||
    message.structuredPayload?.voiceNote?.localUri ||
    (message.attachments && message.attachments.length > 0 ? message.attachments[0].url : null)
  );
};
