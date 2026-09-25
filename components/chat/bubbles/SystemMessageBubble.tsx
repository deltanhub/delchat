import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage, formatMsgTime } from './types';
import { styles } from './system/styles';

interface SystemMessageBubbleProps {
  message: ChatMessage;
  isCurrentUser?: boolean;
}

export default function SystemMessageBubble({ message, isCurrentUser }: SystemMessageBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const callLog = (message.structuredPayload?.callLog || message.structured_payload?.callLog) as
    | {
        callId: string;
        callMode: 'audio' | 'video';
        callStatus: 'accepted' | 'declined' | 'missed' | 'ended' | 'canceled' | 'failed';
        initiatedByUserId?: string;
        durationSeconds?: number;
      }
    | undefined;

  // 1. Render Rich Call Log Card matching DeltanHub web (chats-workspace.tsx lines 5920-5990)
  if (callLog) {
    const isOutgoing =
      typeof isCurrentUser === 'boolean'
        ? isCurrentUser
        : callLog.initiatedByUserId ? callLog.initiatedByUserId === message.senderUserId : false;
    const isVideo = callLog.callMode === 'video';
    const status = callLog.callStatus;

    let statusText = '';
    let isRed = false;

    if (status === 'missed') {
      statusText = isOutgoing ? 'No answer' : 'Missed';
      isRed = !isOutgoing;
    } else if (status === 'declined') {
      statusText = 'Declined';
      isRed = true;
    } else if (status === 'canceled') {
      statusText = 'Canceled';
    } else if (status === 'ended') {
      const dur = callLog.durationSeconds ?? 0;
      if (dur > 0) {
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        statusText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      } else {
        statusText = 'Ended';
      }
    } else {
      statusText = 'Failed';
      isRed = true;
    }

    const directionLabel = isOutgoing ? 'Outgoing' : 'Incoming';
    const callTypeLabel = isVideo ? 'video call' : 'voice call';
    const displayTitle = `${directionLabel} ${callTypeLabel}`;

    const iconBg = isRed
      ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
      : (isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4');

    const iconColor = isRed ? (isDark ? '#f87171' : '#ef4444') : (isDark ? '#4ade80' : '#16a34a');

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        layout={LinearTransition.springify().damping(14)}
        style={styles.systemContainer}
      >
        <View
          style={[
            styles.callCard,
            {
              backgroundColor: isDark ? '#1a1a1e' : '#ffffff',
              borderColor: isDark ? '#3a1520' : '#efe3e8',
            },
          ]}
        >
          {/* Status Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons
              name={isVideo ? 'videocam' : isRed ? 'call' : 'call'}
              size={17}
              color={iconColor}
            />
          </View>

          {/* Call Details */}
          <View style={styles.textContainer}>
            <Text
              style={[styles.callTitle, { color: isDark ? '#f1f5f9' : '#141c2b' }]}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
            <Text
              style={[
                styles.callSubtitle,
                { color: isRed ? (isDark ? '#f87171' : '#ef4444') : (isDark ? '#94a3b8' : '#7b6570') },
              ]}
            >
              {statusText}
            </Text>
          </View>

          {/* Sent Time */}
          {message.sentAt ? (
            <Text style={[styles.timeText, { color: isDark ? '#64748b' : '#8a99ad' }]}>
              {formatMsgTime(message.sentAt)}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  // 2. Fallback Standard System Capsule Notice
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={LinearTransition.springify().damping(14)}
      style={styles.systemContainer}
    >
      <View style={[styles.systemBubble, { backgroundColor: isDark ? '#1c1c1e' : '#eef2f7' }]}>
        <Text style={[styles.systemText, { color: isDark ? '#a1a1aa' : '#556980' }]}>
          {message.body}
        </Text>
      </View>
    </Animated.View>
  );
}
