import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from '../../../lib/haptics';
import { CallHeader } from './CallHeader';
import { SafeRTCView } from './SafeRTCView';
import { videoPreviewStageStyles as styles } from './videoPreviewStageStyles';

export interface CallVideoPreviewStageProps {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerRole?: string | null;
  statusText: string;
  isVideoOff?: boolean;
  isFrontCamera?: boolean;
  onFlipCamera?: () => void;
  localStream?: any;
  topInset: number;
}

export const CallVideoPreviewStage: React.FC<CallVideoPreviewStageProps> = ({
  partnerName,
  partnerAvatarUrl,
  partnerRole,
  statusText,
  isVideoOff = false,
  isFrontCamera = true,
  onFlipCamera,
  localStream,
  topInset,
}) => {
  const [permission] = useCameraPermissions();
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.4);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 900 }),
        withTiming(0.2, { duration: 900 })
      ),
      -1,
      true
    );
  }, [ringScale, ringOpacity]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFlipCamera?.();
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 1. Live Background Camera Preview */}
      {!isVideoOff && localStream ? (
        <SafeRTCView
          stream={localStream}
          mirror={isFrontCamera}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
        />
      ) : !isVideoOff && permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={isFrontCamera ? 'front' : 'back'}
        />
      ) : (
        <View style={styles.backdropFill} />
      )}

      {/* 2. Dark Vignette Tint */}
      <View style={styles.vignette} />

      {/* 3. Floating Flip Button */}
      {!isVideoOff && onFlipCamera && (
        <TouchableOpacity
          onPress={handleFlip}
          style={[styles.flipBtn, { top: topInset + 16 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="camera-reverse" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* 4. Foreground Header and Calling Avatar */}
      <View style={[styles.stageContainer, { paddingTop: topInset + 24 }]}>
        <CallHeader
          partnerName={partnerName}
          partnerRole={partnerRole}
          statusText={statusText}
          showSecurityBadge
        />

        <View style={styles.avatarSection}>
          <Animated.View style={[styles.pulseRing, animatedRingStyle]} />

          <View style={styles.avatarContainer}>
            {partnerAvatarUrl ? (
              <Image source={{ uri: partnerAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {(partnerName || 'DH').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.callKindBadge}>
              <Ionicons name="videocam" size={16} color="#ffffff" />
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </View>
    </View>
  );
};
