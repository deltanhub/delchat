import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { MediaViewerStageProps } from './types';

export const MediaViewerStage: React.FC<MediaViewerStageProps> = ({
  mediaUrl,
  isVideo,
  onOpenExternal,
}) => {
  return (
    <View style={styles.stageContainer}>
      <Image
        source={{ uri: mediaUrl }}
        style={styles.fullImage}
        resizeMode="contain"
      />

      {isVideo && (
        <TouchableOpacity onPress={onOpenExternal} style={styles.playButtonOverlay}>
          <Ionicons name="play-circle" size={68} color="rgba(255,255,255,0.92)" />
          <Text style={styles.playHintText}>Tap to play video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
