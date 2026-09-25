import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface VoiceNoteMicBadgeProps {
  isCurrentUser: boolean;
  isDark: boolean;
  primaryColor: string;
}

export function VoiceNoteMicBadge({
  isCurrentUser,
  isDark,
  primaryColor,
}: VoiceNoteMicBadgeProps) {
  return (
    <View style={styles.vnAvatarCol}>
      <View
        style={[
          styles.vnAvatarPlaceholder,
          {
            backgroundColor: isCurrentUser
              ? 'rgba(255, 255, 255, 0.2)'
              : isDark
              ? '#27272a'
              : '#f1f5f9',
          },
        ]}
      >
        <Ionicons
          name="mic"
          size={16}
          color={isCurrentUser ? '#ffffff' : isDark ? '#f4a5b8' : primaryColor}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  vnAvatarCol: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vnAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
