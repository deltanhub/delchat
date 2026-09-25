import { Linking, Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';

export function checkIsVideo(mediaKind?: string, mediaUrl?: string | null): boolean {
  if (mediaKind === 'video') return true;
  if (!mediaUrl) return false;
  const lower = mediaUrl.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
}

export async function openMediaUrl(mediaUrl: string): Promise<void> {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const supported = await Linking.canOpenURL(mediaUrl);
    if (supported) {
      await Linking.openURL(mediaUrl);
    } else {
      Alert.alert('Link Error', 'Unable to open media link.');
    }
  } catch (err: any) {
    Alert.alert('Error', err.message || 'Failed to open media link');
  }
}
