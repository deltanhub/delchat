import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { Typography } from '../../constants/Typography';

interface MediaViewerModalProps {
  visible: boolean;
  mediaUrl: string | null;
  mediaKind?: 'image' | 'video' | string;
  title?: string;
  onClose: () => void;
}

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

  const isVideo = mediaKind === 'video' || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov');

  const handleOpenExternal = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(mediaUrl);
      if (supported) {
        await Linking.openURL(mediaUrl);
      } else {
        Alert.alert('Link Error', 'Unable to open media link.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

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
        {/* Top Header Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={styles.topBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>

          <TouchableOpacity
            onPress={handleOpenExternal}
            style={styles.topBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="open-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Media Content Stage */}
        <View style={styles.stageContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />

          {isVideo && (
            <TouchableOpacity onPress={handleOpenExternal} style={styles.playButtonOverlay}>
              <Ionicons name="play-circle" size={68} color="rgba(255,255,255,0.92)" />
              <Text style={styles.playHintText}>Tap to play video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Bar Info */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={handleOpenExternal}
            style={styles.externalButton}
          >
            <Ionicons name="download-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.externalButtonText}>View Full Original File</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    maxWidth: '65%',
    textAlign: 'center',
  },
  stageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playHintText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  externalButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});

export default MediaViewerModal;
