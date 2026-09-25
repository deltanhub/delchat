import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { TRUSTED_3D_DOMAINS } from './constants';

let ExpoClipboard: any = null;
try {
  ExpoClipboard = require('expo-clipboard');
} catch {}

interface UseEmbedUrlFormParams {
  onSubmit: (url: string, title?: string) => void;
  onClose: () => void;
}

export function useEmbedUrlForm({ onSubmit, onClose }: UseEmbedUrlFormParams) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      if (ExpoClipboard?.getStringAsync) {
        const text = await ExpoClipboard.getStringAsync();
        if (text) {
          setUrl(text.trim());
          setError(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch {}
  };

  const executeSubmit = (targetUrl: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(targetUrl, title.trim() || undefined);
    setUrl('');
    setTitle('');
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a valid URL.');
      return;
    }

    if (!trimmed.startsWith('https://')) {
      setError('For security, all virtual tours and embeds must use secure https:// (http:// is not permitted).');
      return;
    }

    let hostname = '';
    try {
      hostname = new URL(trimmed).hostname.toLowerCase();
    } catch {
      setError('Please enter a valid, complete web URL format.');
      return;
    }

    const isTrusted = TRUSTED_3D_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isTrusted) {
      Alert.alert(
        'Unverified External Domain',
        `This link points to an external website (${hostname}) that is not on the verified virtual tour whitelist (Matterport, Kuula, YouTube, Vimeo, DeltanHub).\n\nDo you confirm this is a trusted 3D showcase or media resource and wish to share it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Anyway',
            style: 'destructive',
            onPress: () => executeSubmit(trimmed),
          },
        ]
      );
      return;
    }

    executeSubmit(trimmed);
  };

  return {
    url,
    setUrl,
    title,
    setTitle,
    error,
    setError,
    handlePaste,
    handleSubmit,
  };
}
