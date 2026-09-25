import { useState, useCallback } from 'react';
import type { MediaViewerKind } from './types';

export function useMediaViewerState() {
  const [mediaViewerUrl, setMediaViewerUrl] = useState<string | null>(null);
  const [mediaViewerKind, setMediaViewerKind] = useState<MediaViewerKind>('image');
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);

  const openMediaViewer = useCallback((url: string, kind: MediaViewerKind = 'image') => {
    setMediaViewerUrl(url);
    setMediaViewerKind(kind);
    setMediaViewerVisible(true);
  }, []);

  const closeMediaViewer = useCallback(() => {
    setMediaViewerVisible(false);
    setMediaViewerUrl(null);
  }, []);

  return {
    mediaViewerUrl,
    mediaViewerKind,
    mediaViewerVisible,
    openMediaViewer,
    closeMediaViewer,
  };
}
