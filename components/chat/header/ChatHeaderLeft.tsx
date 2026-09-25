import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { ChatHeaderLeftProps, PresenceStatus } from './types';

const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getPresenceColor = (status: PresenceStatus): string => {
  if (status === 'available') return '#16a34a';
  if (status === 'busy') return '#d97706';
  return '#64748b';
};

export const ChatHeaderLeft: React.FC<ChatHeaderLeftProps> = ({
  partnerName,
  partnerAvatarUrl,
  subtitle,
  isTyping,
  isOnline = false,
  lastSeenText = null,
  presenceStatus,
  isGroup = false,
  participantCount,
  participantNames,
  isDark,
  onBack,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const headerIconColor = isDark ? '#ffffff' : colors.primary;

  const isDeltanHubBrand =
    partnerName.toUpperCase() === 'DELTANHUB' ||
    partnerName.toUpperCase() === 'DELTANHUB SUPPORT';

  return (
    <View style={styles.leftSection}>
      <ScalePressable onPress={onBack} style={styles.iconButton}>
        <Ionicons name="chevron-back" size={24} color={headerIconColor} />
      </ScalePressable>

      <View style={styles.avatarCol}>
        {isGroup ? (
          <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#3d1624' : '#fcedf2' }]}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
        ) : partnerAvatarUrl ? (
          <View style={styles.avatarFrame}>
            <Image source={{ uri: partnerAvatarUrl }} style={styles.avatar} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}>
            <Text style={[styles.avatarInitialsText, { color: isDark ? '#ffffff' : colors.primary }]}>{getInitials(partnerName)}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsCol}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={[styles.partnerNameText, { color: colors.text }]} numberOfLines={1}>
            {partnerName}
          </Text>
          {presenceStatus && (
            <View style={[styles.presenceDot, { backgroundColor: getPresenceColor(presenceStatus) }]} accessibilityLabel={`Status: ${presenceStatus}`} />
          )}
          {isGroup && typeof participantCount === 'number' && participantCount > 0 && (
            <View style={[styles.groupBadge, { backgroundColor: isDark ? '#27272a' : '#f4e7eb' }]}>
              <Text style={[styles.groupBadgeText, { color: isDark ? '#f4a5b8' : colors.primary }]}>{participantCount} members</Text>
            </View>
          )}
          {isDeltanHubBrand && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#ffffff" />
            </View>
          )}
        </View>

        <Text
          style={[
            styles.statusText,
            { color: isTyping || isOnline ? (isDark ? '#34d399' : '#059669') : (isDark ? '#9ca3af' : colors.placeholder) },
          ]}
          numberOfLines={1}
        >
          {isTyping ? 'typing...' : isOnline ? 'online' : isGroup && participantNames && participantNames.length > 0 ? participantNames.join(', ') : lastSeenText || subtitle}
        </Text>
      </View>
    </View>
  );
};
