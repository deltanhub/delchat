import React from 'react';
import { View, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MediaViewerModalProps,
  styles,
  checkIsVideo,
  openMediaUrl,
  MediaViewerTopBar,
  MediaViewerStage,
  MediaViewerBottomBar,
} from './media_viewer';

export type { MediaViewerModalProps };

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  visible,
  mediaUrl,
  mediaKind = 'image',
  title = 'Media',
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible || !mediaUrl) {
    return null;
  }

  const isVideo = checkIsVideo(mediaKind, mediaUrl);
  const handleOpenExternal = () => openMediaUrl(mediaUrl);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <MediaViewerTopBar
          title={title}
          onClose={onClose}
          onOpenExternal={handleOpenExternal}
          topInset={insets.top}
        />

        <MediaViewerStage
          mediaUrl={mediaUrl}
          isVideo={isVideo}
          onOpenExternal={handleOpenExternal}
        />

        <MediaViewerBottomBar
          onOpenExternal={handleOpenExternal}
          bottomInset={insets.bottom}
        />
      </View>
    </Modal>
  );
};

export default MediaViewerModal;
