import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from '../../lib/haptics';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import ScalePressable from '../ScalePressable';

interface MediaPreviewModalProps {
  visible: boolean;
  assets: ImagePicker.ImagePickerAsset[];
  onCancel: () => void;
  onSend: (assets: ImagePicker.ImagePickerAsset[], caption: string) => void;
  isSending?: boolean;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  visible,
  assets,
  onCancel,
  onSend,
  isSending = false,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [stagedAssets, setStagedAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    if (visible && assets.length > 0) {
      setStagedAssets([...assets]);
      setSelectedIndex(0);
      setCaption('');
    }
  }, [visible, assets]);

  if (!visible || stagedAssets.length === 0) {
    return null;
  }

  const currentAsset = stagedAssets[selectedIndex] || stagedAssets[0];
  const isVideo =
    currentAsset?.type === 'video' ||
    currentAsset?.uri?.toLowerCase().endsWith('.mp4') ||
    currentAsset?.uri?.toLowerCase().endsWith('.mov');

  const handleRemoveAsset = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = stagedAssets.filter((_, i) => i !== index);
    if (updated.length === 0) {
      onCancel();
    } else {
      setStagedAssets(updated);
      if (selectedIndex >= updated.length) {
        setSelectedIndex(updated.length - 1);
      }
    }
  };

  const handleSendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend(stagedAssets, caption);
  };

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
        {/* Top Navigation Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCancel();
            }}
            style={styles.topBarBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.topCenterTitle}>
            {stagedAssets.length > 1 && (
              <Text style={styles.counterText}>
                {selectedIndex + 1} of {stagedAssets.length}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleRemoveAsset(selectedIndex)}
            style={styles.topBarBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="trash-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Main Preview Image/Video */}
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

        {/* Bottom Actions & Caption Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Multi-asset Thumbnail Strip */}
          {stagedAssets.length > 1 && (
            <View style={styles.thumbnailStripContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailScrollContent}
              >
                {stagedAssets.map((asset, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <TouchableOpacity
                      key={`${asset.uri}-${index}`}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedIndex(index);
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
          )}

          {/* Caption Input & Send Row */}
          <View
            style={[
              styles.captionRowContainer,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <View style={styles.captionInputWrapper}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="rgba(255,255,255,0.6)"
                style={{ marginLeft: 12, marginRight: 6 }}
              />
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
              />
            </View>

            <ScalePressable
              onPress={handleSendPress}
              disabled={isSending}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: Colors.light.primary,
                  opacity: isSending ? 0.7 : 1,
                },
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={19} color="#ffffff" style={{ marginLeft: 2 }} />
              )}
            </ScalePressable>
          </View>
        </KeyboardAvoidingView>
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
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterTitle: {
    alignItems: 'center',
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoBadgeOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailStripContainer: {
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  thumbnailScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  thumbWrapperActive: {
    borderColor: Colors.light.primary,
    transform: [{ scale: 1.05 }],
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  activeBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  captionRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    gap: 12,
  },
  captionInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    minHeight: 46,
    maxHeight: 100,
    paddingRight: 12,
  },
  captionInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default MediaPreviewModal;
