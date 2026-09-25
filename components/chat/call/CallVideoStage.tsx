import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { videoStageStyles as styles } from './videoStageStyles';
import { SafeRTCView } from './SafeRTCView';

export interface CallVideoStageProps {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  remoteIsVideoOff?: boolean;
  remoteIsMuted?: boolean;
  connectionHealth?: 'connected' | 'reconnecting' | 'failed';
  durationText: string;
  topInset: number;
  onToggleControls?: () => void;
  remoteStream?: any;
}

export const CallVideoStage: React.FC<CallVideoStageProps> = ({
  partnerName,
  partnerAvatarUrl,
  remoteIsVideoOff = false,
  remoteIsMuted = false,
  connectionHealth = 'connected',
  durationText,
  topInset,
  onToggleControls,
  remoteStream,
}) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.remoteVideoCanvas} onPress={onToggleControls}>
        {remoteStream && !remoteIsVideoOff ? (
          <SafeRTCView stream={remoteStream} style={StyleSheet.absoluteFill} objectFit="cover" />
        ) : partnerAvatarUrl ? (
          <Image
            source={{ uri: partnerAvatarUrl }}
            style={styles.remoteVideoBackdropImage}
            blurRadius={Platform.OS === 'ios' ? 14 : 8}
          />
        ) : (
          <View style={styles.remoteVideoPlaceholderBackdrop} />
        )}

        <View style={styles.videoVignetteOverlay} />

        {/* Center High-Def Video Card */}
        <View style={[styles.centerVideoCard, remoteStream && !remoteIsVideoOff && { backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0, elevation: 0 }]}>
          {(!remoteStream || remoteIsVideoOff) && (
            partnerAvatarUrl ? (
              <Image source={{ uri: partnerAvatarUrl }} style={styles.centerVideoImage} />
            ) : (
              <View style={styles.centerVideoPlaceholder}>
                <Text style={styles.centerVideoInitials}>
                  {(partnerName || 'DH').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )
          )}

          {remoteIsVideoOff ? (
            <View style={styles.cameraPausedBadge}>
              <Ionicons name="videocam-off" size={12} color="#fbbf24" style={{ marginRight: 5 }} />
              <Text style={styles.cameraPausedText}>Camera Paused</Text>
            </View>
          ) : (
            <View style={styles.videoQualityBadge}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveQualityText}>HD 1080p · Live</Text>
            </View>
          )}

          {connectionHealth !== 'connected' && (
            <View style={styles.connectionHealthBadge}>
              <Ionicons name="warning" size={12} color="#f87171" style={{ marginRight: 4 }} />
              <Text style={styles.connectionHealthText}>
                {connectionHealth === 'reconnecting' ? 'Reconnecting...' : 'Network Failed'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Floating Top Pill */}
      <View style={[styles.videoHeaderBar, { top: topInset + 16 }]} pointerEvents="box-none">
        <View style={styles.videoHeaderPill}>
          <Ionicons name="lock-closed" size={12} color="#4ade80" style={{ marginRight: 6 }} />
          <Text style={styles.videoHeaderName} numberOfLines={1}>
            {partnerName}
          </Text>
          {remoteIsMuted && (
            <View style={styles.partnerMuteBadge}>
              <Ionicons name="mic-off" size={12} color="#f87171" style={{ marginRight: 3 }} />
              <Text style={styles.partnerMuteText}>Muted</Text>
            </View>
          )}
          <View style={styles.headerPillDivider} />
          <Text style={styles.videoHeaderDuration}>{durationText}</Text>
        </View>
      </View>
    </View>
  );
};
