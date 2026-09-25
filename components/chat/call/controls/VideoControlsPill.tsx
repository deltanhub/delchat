import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../../lib/haptics';
import { styles } from './styles';
import { VideoControlsPillProps } from './types';

export const VideoControlsPill: React.FC<VideoControlsPillProps> = ({
  bottomInset,
  isMuted,
  isVideoOff,
  isSpeakerOn,
  onToggleMute,
  onSwitchCamera,
  onToggleVideo,
  onToggleSpeaker,
  onEndCall,
}) => {
  return (
    <View
      style={[
        styles.videoControlsDock,
        { paddingBottom: Math.max(bottomInset, 24) },
      ]}
    >
      <View style={styles.videoControlsPill}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleMute?.();
          }}
          style={[styles.dockBtn, isMuted && styles.dockBtnActive]}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color={isMuted ? '#ffffff' : '#f8fafc'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSwitchCamera?.();
          }}
          style={styles.dockBtn}
        >
          <Ionicons name="camera-reverse" size={24} color="#f8fafc" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleVideo?.();
          }}
          style={[styles.dockBtn, isVideoOff && styles.dockBtnActiveRed]}
        >
          <Ionicons
            name={isVideoOff ? 'videocam-off' : 'videocam'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleSpeaker?.();
          }}
          style={[styles.dockBtn, isSpeakerOn && styles.dockBtnActive]}
        >
          <Ionicons
            name={isSpeakerOn ? 'volume-high' : 'volume-medium-outline'}
            size={24}
            color={isSpeakerOn ? '#ffffff' : '#f8fafc'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onEndCall?.();
          }}
          style={[styles.dockBtn, styles.dockBtnEnd]}
        >
          <Ionicons
            name="call"
            size={24}
            color="#ffffff"
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
