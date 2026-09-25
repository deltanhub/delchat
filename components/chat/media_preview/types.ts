import type * as ImagePicker from 'expo-image-picker';

export interface MediaPreviewModalProps {
  visible: boolean;
  assets: ImagePicker.ImagePickerAsset[];
  onCancel: () => void;
  onSend: (assets: ImagePicker.ImagePickerAsset[], caption: string) => void;
  isSending?: boolean;
}

export interface MediaPreviewTopBarProps {
  topInset: number;
  totalAssets: number;
  selectedIndex: number;
  onCancel: () => void;
  onRemoveCurrent: () => void;
}

export interface MediaPreviewMainViewProps {
  currentAsset: ImagePicker.ImagePickerAsset | undefined;
  isVideo: boolean;
}

export interface MediaPreviewThumbnailStripProps {
  assets: ImagePicker.ImagePickerAsset[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export interface MediaPreviewCaptionBarProps {
  bottomInset: number;
  caption: string;
  onChangeCaption: (caption: string) => void;
  onSend: () => void;
  isSending: boolean;
}
