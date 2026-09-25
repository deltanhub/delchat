import React from 'react';
import { View, Image, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { MediaPreviewThumbnailStripProps } from './types';

export const MediaPreviewThumbnailStrip: React.FC<MediaPreviewThumbnailStripProps> = ({
  assets,
  selectedIndex,
  onSelectIndex,
}) => {
  if (assets.length <= 1) return null;

  return (
    <View style={styles.thumbnailStripContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailScrollContent}
      >
        {assets.map((asset, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={`${asset.uri}-${index}`}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectIndex(index);
              }}
              style={[
                styles.thumbWrapper,
                isSelected && styles.thumbWrapperActive,
              ]}
            >
              <Image source={{ uri: asset.uri }} style={styles.thumbImage} />
              {isSelected && <View style={styles.activeBorderOverlay} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
