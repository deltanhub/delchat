import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { resolveAvatarUrl } from '../../../lib/media-utils';
import { callRepository } from '../../../lib/repositories/callRepository';
import { styles } from './styles';
import type { RecentCallItemProps } from './types';

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const RecentCallItem: React.FC<RecentCallItemProps> = ({
  log,
  isDark,
  onSelectConversation,
  onRedial,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isMissed = log.direction === 'missed';
  const isOutgoing = log.direction === 'outgoing';
  const isVideo = log.callMode === 'video';

  const directionColor = isOutgoing
    ? isDark ? '#94a3b8' : '#718096'
    : isMissed
    ? isDark ? '#f87171' : '#9d263d'
    : isDark ? '#4ade80' : '#16a34a';

  const resolvedAvatar = resolveAvatarUrl(log.peer.avatarUrl);

  return (
    <ScalePressable
      onPress={() => onSelectConversation(log.conversationId, log.peer.displayName)}
      style={[
        styles.rowItem,
        {
          backgroundColor: colors.background,
          borderBottomColor: isDark ? '#262626' : '#edf2f7',
        },
      ]}
    >
      <View style={styles.avatarContainer}>
        {resolvedAvatar ? (
          <Image source={{ uri: resolvedAvatar }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              { backgroundColor: isDark ? '#262626' : colors.primarySoft },
            ]}
          >
            <Text
              style={[
                styles.avatarFallbackText,
                { color: isDark ? '#ffffff' : colors.primary },
              ]}
            >
              {getInitials(log.peer.displayName)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text
          style={[
            styles.peerName,
            { color: isMissed ? (isDark ? '#f87171' : '#9d263d') : colors.text },
          ]}
          numberOfLines={1}
        >
          {log.peer.displayName}
        </Text>

        <View style={styles.subtitleRow}>
          <Ionicons
            name={isOutgoing ? 'arrow-up' : 'arrow-down'}
            size={13}
            color={directionColor}
            style={{ transform: [{ rotate: '45deg' }] }}
          />
          <Text style={[styles.subtitleText, { color: colors.placeholder }]}>
            {isOutgoing ? 'Outgoing' : isMissed ? 'Missed' : 'Incoming'}
            {log.count > 1 ? ` (${log.count})` : ''}
            {' • '}
            {isVideo ? 'Video' : 'Voice'}
          </Text>
        </View>
      </View>

      <View style={styles.rightContainer}>
        <Text style={[styles.timeText, { color: colors.placeholder }]}>
          {callRepository.formatCallTime(log.startedAt)}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => onRedial(log, 'audio')}
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark ? '#262626' : '#f1f5f9',
                borderColor: isDark ? '#383838' : '#e2e8f0',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Call back voice"
          >
            <Ionicons name="call" size={15} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onRedial(log, 'video')}
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark ? '#262626' : '#f1f5f9',
                borderColor: isDark ? '#383838' : '#e2e8f0',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Call back video"
          >
            <Ionicons name="videocam" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </ScalePressable>
  );
};
