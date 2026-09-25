import React from 'react';
import {
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MediaPreviewModalProps,
  styles,
  useMediaPreviewStage,
  MediaPreviewTopBar,
  MediaPreviewMainView,
  MediaPreviewThumbnailStrip,
  MediaPreviewCaptionBar,
} from './media_preview';

export { MediaPreviewModalProps } from './media_preview';

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  visible,
  assets,
  onCancel,
  onSend,
  isSending = false,
}) => {
  const insets = useSafeAreaInsets();

  const {
    selectedIndex,
    setSelectedIndex,
    caption,
    setCaption,
    stagedAssets,
    currentAsset,
    isVideo,
    handleRemoveAsset,
    handleSendPress,
  } = useMediaPreviewStage({ visible, assets, onCancel, onSend });

  if (!visible || stagedAssets.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <MediaPreviewTopBar
          topInset={insets.top}
          totalAssets={stagedAssets.length}
          selectedIndex={selectedIndex}
          onCancel={onCancel}
          onRemoveCurrent={() => handleRemoveAsset(selectedIndex)}
        />

        <MediaPreviewMainView
          currentAsset={currentAsset}
          isVideo={isVideo}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <MediaPreviewThumbnailStrip
            assets={stagedAssets}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
          />

          <MediaPreviewCaptionBar
            bottomInset={insets.bottom}
            caption={caption}
            onChangeCaption={setCaption}
            onSend={handleSendPress}
            isSending={isSending}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default MediaPreviewModal;
