import React from 'react';
import { StyleSheet, View, Image, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextMediaGridProps } from './types';

export function TextMediaGrid({
  mediaItems,
  messageBody,
  onPressMedia,
}: TextMediaGridProps) {
  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    <View style={styles.mediaGrid}>
      {mediaItems.map((att) => (
        <Pressable
          key={att.id}
          onPress={() => {
            if (onPressMedia && att.url) {
              onPressMedia(att.url, att.kind, att.originalName || messageBody || 'Media');
            } else if (att.url) {
              Linking.openURL(att.url).catch(() => null);
            }
          }}
          style={styles.mediaItemContainer}
          accessibilityLabel={`Media attachment: ${att.originalName || 'Image'}`}
          accessibilityRole="button"
        >
          <Image source={{ uri: att.url }} style={styles.mediaImage} resizeMode="cover" />
          {att.kind === 'video' && (
            <View style={styles.videoOverlayBadge}>
              <Ionicons name="play-circle" size={32} color="#ffffff" />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mediaGrid: {
    marginBottom: 6,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 4,
  },
  mediaItemContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
  },
  videoOverlayBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default TextMediaGrid;
