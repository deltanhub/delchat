import { useState, useCallback } from 'react';
import type * as ImagePicker from 'expo-image-picker';

export function useStagedMediaState() {
  const [stagedMediaAssets, setStagedMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const openMediaPreview = useCallback((assets: ImagePicker.ImagePickerAsset[]) => {
    setStagedMediaAssets(assets);
    setMediaPreviewVisible(true);
  }, []);

  const closeMediaPreview = useCallback(() => {
    setMediaPreviewVisible(false);
    setStagedMediaAssets([]);
  }, []);

  return {
    stagedMediaAssets,
    setStagedMediaAssets,
    mediaPreviewVisible,
    setMediaPreviewVisible,
    isUploadingMedia,
    setIsUploadingMedia,
    openMediaPreview,
    closeMediaPreview,
  };
}
