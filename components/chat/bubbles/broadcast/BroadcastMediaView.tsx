import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BroadcastMediaItem } from './types';
import { styles } from './styles';

interface BroadcastMediaViewProps {
  media: BroadcastMediaItem[];
  title: string;
  isDark: boolean;
  placeholderColor?: string;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
}

export const BroadcastMediaView: React.FC<BroadcastMediaViewProps> = ({
  media,
  title,
  isDark,
  placeholderColor,
  onPressMedia,
}) => {
  return (
    <>
      {/* Images / Flyers */}
      {media.filter((m) => m.kind === 'image').map((img, idx) => (
        <Pressable
          key={idx}
          onPress={() => onPressMedia?.(img.url, 'image', img.title || title)}
          style={styles.imageContainer}
        >
          <Image source={{ uri: img.url }} style={styles.bannerImage} resizeMode="cover" />
        </Pressable>
      ))}

      {/* Video preview / launcher */}
      {media.filter((m) => m.kind === 'video').map((vid, idx) => (
        <Pressable
          key={idx}
          onPress={() => Linking.openURL(vid.url)}
          style={styles.videoContainer}
        >
          <View style={styles.playButton}>
            <Ionicons name="play" size={22} color="#ffffff" style={{ marginLeft: 2 }} />
          </View>
          <Text style={styles.videoPromptText}>
            Watch Promotional Video ↗
          </Text>
        </Pressable>
      ))}

      {/* 3D Tour launcher */}
      {media.filter((m) => m.kind === 'tour').map((tour, idx) => (
        <Pressable
          key={idx}
          onPress={() => Linking.openURL(tour.url)}
          style={[
            styles.tourContainer,
            {
              backgroundColor: isDark ? '#201015' : '#fcf5f7',
              borderBottomColor: isDark ? '#3a1a24' : '#f0e0e5',
            },
          ]}
        >
          <Ionicons name="cube" size={20} color="#5C1324" />
          <View style={{ flex: 1 }}>
            <Text style={styles.tourTitle}>Interactive 3D Virtual Tour</Text>
            <Text style={[styles.tourSubtitle, { color: placeholderColor }]}>
              Tap to open immersive tour ↗
            </Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#5C1324" />
        </Pressable>
      ))}
    </>
  );
};
