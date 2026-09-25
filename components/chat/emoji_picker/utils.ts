import { Dimensions } from 'react-native';

export const RECENT_STORAGE_KEY = 'deltanhub_recent_emojis';
const { width } = Dimensions.get('window');
export const COLUMN_COUNT = 8;
export const EMOJI_SIZE = (width - 32) / COLUMN_COUNT;

export const getCountryCodeFromFlag = (flagEmoji: string): string | null => {
  if (!flagEmoji) return null;
  const codePoints = [...flagEmoji].map((c) => c.codePointAt(0) || 0);
  if (codePoints.length >= 2 && codePoints.every((cp) => cp >= 127462 && cp <= 127487)) {
    return codePoints.map((cp) => String.fromCharCode(cp - 127462 + 65)).join('').toLowerCase();
  }
  return null;
};
