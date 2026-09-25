import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import SafeBlurView from '../../SafeBlurView';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import { IncomingCallCardProps } from './types';

export function IncomingCallCard({
  incomingCall,
  animatedRingStyle,
  onAccept,
  onDecline,
}: IncomingCallCardProps) {
  const isVideo = incomingCall.callMode === 'video';

  return (
    <View style={styles.cardWrapper}>
      <SafeBlurView
        intensity={85}
        tint="dark"
        fallbackBackgroundColor="rgba(20, 20, 24, 0.96)"
        style={styles.blurCard}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                { borderColor: isVideo ? '#60a5fa' : '#4ade80' },
                animatedRingStyle,
              ]}
            />
            {incomingCall.callerAvatarUrl ? (
              <Image
                source={{ uri: incomingCall.callerAvatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {(incomingCall.callerName || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.textDetails}>
            <Text style={styles.callerName} numberOfLines={1}>
              {incomingCall.callerName}
            </Text>
            <View style={styles.kindRow}>
              <Ionicons
                name={isVideo ? 'videocam' : 'call'}
                size={12}
                color={isVideo ? '#60a5fa' : '#4ade80'}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.callKindText}>
                Incoming {isVideo ? 'Video' : 'Voice'} Call
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <ScalePressable
              onPress={onDecline}
              accessibilityRole="button"
              accessibilityLabel="Decline Call"
              accessibilityHint="Declines the incoming call"
              style={[styles.actionBtn, styles.declineBtn]}
            >
              <Ionicons name="call" size={22} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
            </ScalePressable>

            <ScalePressable
              onPress={onAccept}
              accessibilityRole="button"
              accessibilityLabel={isVideo ? 'Accept Video Call' : 'Accept Voice Call'}
              accessibilityHint="Answers and connects the incoming call"
              style={[styles.actionBtn, styles.acceptBtn]}
            >
              <Ionicons name={isVideo ? 'videocam' : 'call'} size={22} color="#ffffff" />
            </ScalePressable>
          </View>
        </View>
      </SafeBlurView>
    </View>
  );
}

export default IncomingCallCard;
