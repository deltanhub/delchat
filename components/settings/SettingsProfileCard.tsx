import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { SettingsProfileCardProps } from './types';

export function SettingsProfileCard({
  profile,
  role,
  roleLabel,
  displayName,
  userEmail,
  avatarUrl,
  initialLetter,
  colors,
  isDark,
  roleBadgeStyle,
}: SettingsProfileCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.profileRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarLetter, { color: colors.primary }]}>
              {initialLetter}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.roleBadgeContainer}>
            <View
              style={[
                styles.roleBadge,
                roleBadgeStyle,
                {
                  backgroundColor:
                    role === 'Buyer'
                      ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.08)'
                      : isDark ? 'rgba(74, 15, 31, 0.35)' : 'rgba(74, 15, 31, 0.10)',
                  borderColor:
                    role === 'Buyer'
                      ? isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.22)'
                      : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(74, 15, 31, 0.25)',
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  {
                    color: role === 'Buyer' ? (isDark ? '#60a5fa' : '#2563eb') : colors.primary,
                  },
                ]}
              >
                {roleLabel}
              </Text>
            </View>

            {profile?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#2563eb" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            )}
          </View>
          {userEmail ? (
            <Text style={[styles.profileEmailSubtext, { color: colors.placeholder }]} numberOfLines={1}>
              {userEmail}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default SettingsProfileCard;
