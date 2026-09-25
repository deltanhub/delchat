import { useState, useEffect } from 'react';
import type * as ImagePicker from 'expo-image-picker';
import * as Haptics from '../../../lib/haptics';

interface UseMediaPreviewStageParams {
  visible: boolean;
  assets: ImagePicker.ImagePickerAsset[];
  onCancel: () => void;
  onSend: (assets: ImagePicker.ImagePickerAsset[], caption: string) => void;
}

export function useMediaPreviewStage({
  visible,
  assets,
  onCancel,
  onSend,
}: UseMediaPreviewStageParams) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [stagedAssets, setStagedAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    if (visible && assets.length > 0) {
      setStagedAssets([...assets]);
      setSelectedIndex(0);
      setCaption('');
    }
  }, [visible, assets]);

  const currentAsset = stagedAssets[selectedIndex] || stagedAssets[0];
  const isVideo = Boolean(
    currentAsset?.type === 'video' ||
    currentAsset?.uri?.toLowerCase().endsWith('.mp4') ||
    currentAsset?.uri?.toLowerCase().endsWith('.mov')
  );

  const handleRemoveAsset = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = stagedAssets.filter((_, i) => i !== index);
    if (updated.length === 0) {
      onCancel();
    } else {
      setStagedAssets(updated);
      if (selectedIndex >= updated.length) {
        setSelectedIndex(updated.length - 1);
      }
    }
  };

  const handleSendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend(stagedAssets, caption);
  };

  return {
    selectedIndex,
    setSelectedIndex,
    caption,
    setCaption,
    stagedAssets,
    currentAsset,
    isVideo,
    handleRemoveAsset,
    handleSendPress,
  };
}
