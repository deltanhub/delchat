import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../../lib/haptics';
import { styles } from './styles';
import { InCallAudioControlsProps } from './types';

export const InCallAudioControls: React.FC<InCallAudioControlsProps> = ({
  isVideoMode,
  isMuted,
  isSpeakerOn,
  isVideoOff,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onEndCall,
}) => {
  return (
    <View style={styles.inCallControlsContainer}>
      <View style={styles.togglesRow}>
        {/* Mute Toggle */}
        <View style={styles.actionCol}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleMute?.();
            }}
            style={[styles.smallCircleBtn, isMuted && styles.activeToggleBtn]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color={isMuted ? '#4A0F1F' : '#e2e8f0'}
            />
          </TouchableOpacity>
          <Text style={styles.actionBtnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </View>

        {/* Speakerphone Toggle */}
        <View style={styles.actionCol}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleSpeaker?.();
            }}
            style={[styles.smallCircleBtn, isSpeakerOn && styles.activeToggleBtn]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-medium-outline'}
              size={24}
              color={isSpeakerOn ? '#4A0F1F' : '#e2e8f0'}
            />
          </TouchableOpacity>
          <Text style={styles.actionBtnLabel}>Speaker</Text>
        </View>

        {/* Video Upgrade / Switch */}
        <View style={styles.actionCol}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleVideo?.();
            }}
            style={[styles.smallCircleBtn, isVideoOff && styles.activeToggleBtn]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isVideoOff ? 'videocam-off' : 'videocam'}
              size={24}
              color={isVideoOff ? '#4A0F1F' : '#e2e8f0'}
            />
          </TouchableOpacity>
          <Text style={styles.actionBtnLabel}>{isVideoMode ? 'Camera' : 'Video'}</Text>
        </View>
      </View>

      {/* End Call Button */}
      <View style={[styles.actionCol, { marginTop: 28 }]}>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onEndCall?.();
          }}
          style={[styles.circleBtn, styles.endCallBtn]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="call"
            size={32}
            color="#ffffff"
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
        <Text style={[styles.actionBtnLabel, { color: '#f87171' }]}>End Call</Text>
      </View>
    </View>
  );
};
