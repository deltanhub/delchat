import React from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import { MediaPreviewCaptionBarProps } from './types';

export const MediaPreviewCaptionBar: React.FC<MediaPreviewCaptionBarProps> = ({
  bottomInset,
  caption,
  onChangeCaption,
  onSend,
  isSending,
}) => {
  return (
    <View
      style={[
        styles.captionRowContainer,
        { paddingBottom: Math.max(bottomInset, 14) },
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
          onChangeText={onChangeCaption}
          multiline
          maxLength={500}
        />
      </View>

      <ScalePressable
        onPress={onSend}
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
  );
};
