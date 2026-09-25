import React from 'react';
import { View, Text, Image } from 'react-native';
import WatermarkOverlay from '../../WatermarkOverlay';
import { styles } from './styles';
import { ChatListingThumbnailProps } from './types';

export const ChatListingThumbnail: React.FC<ChatListingThumbnailProps> = ({
  imageUrl,
  isDark,
}) => {
  return (
    <View style={[styles.imageContainer, { backgroundColor: isDark ? '#262626' : '#d6dde5' }]}>
      {imageUrl ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <WatermarkOverlay size="xs" opacity={0.35} />
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: isDark ? '#9ca3af' : '#748397' }]}>
            Listing
          </Text>
        </View>
      )}
    </View>
  );
};
