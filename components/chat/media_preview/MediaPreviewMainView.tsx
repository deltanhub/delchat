import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { MediaPreviewMainViewProps } from './types';

export const MediaPreviewMainView: React.FC<MediaPreviewMainViewProps> = ({
  currentAsset,
  isVideo,
}) => {
  return (
    <View style={styles.previewContainer}>
      {currentAsset && (
        <Image
          source={{ uri: currentAsset.uri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      )}

      {isVideo && (
        <View style={styles.videoBadgeOverlay}>
          <Ionicons name="play-circle" size={54} color="rgba(255,255,255,0.9)" />
        </View>
      )}
    </View>
  );
};
