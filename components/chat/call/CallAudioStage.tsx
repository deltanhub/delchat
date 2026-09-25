import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { CallHeader } from './CallHeader';
import { audioStageStyles as styles } from './audioStageStyles';

export interface CallAudioStageProps {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerRole?: string | null;
  statusText: string;
  isConnected: boolean;
}

export const CallAudioStage: React.FC<CallAudioStageProps> = ({
  partnerName,
  partnerAvatarUrl,
  partnerRole,
  statusText,
  isConnected,
}) => {
  const activeAudioScale = useSharedValue(1);
  const activeAudioOpacity = useSharedValue(0);

  useEffect(() => {
    if (isConnected) {
      activeAudioScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      activeAudioOpacity.value = withRepeat(
        withSequence(
          withTiming(0.55, { duration: 1000 }),
          withTiming(0.18, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      activeAudioScale.value = 1;
      activeAudioOpacity.value = 0;
    }
  }, [isConnected, activeAudioScale, activeAudioOpacity]);

  const animatedAudioPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: activeAudioScale.value }],
      opacity: activeAudioOpacity.value,
    };
  });

  return (
    <View style={styles.stageContainer}>
      <CallHeader
        partnerName={partnerName}
        partnerRole={partnerRole}
        statusText={statusText}
        showSecurityBadge
      />

      <View style={styles.avatarSection}>
        {/* Animated Soundwave Aura */}
        <Animated.View style={[styles.pulseRing, animatedAudioPulseStyle]} />

        {/* Central User Avatar */}
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

          {/* Call Kind Indicator Badge */}
          <View style={styles.callKindBadge}>
            <Ionicons name="call" size={16} color="#ffffff" />
          </View>
        </View>
      </View>
    </View>
  );
};
