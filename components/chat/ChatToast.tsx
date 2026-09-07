import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';

interface ChatToastProps {
  message: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  duration?: number;
  onDismiss?: () => void;
}

export default function ChatToast({
  message,
  icon = 'checkmark-circle',
  duration = 2400,
  onDismiss,
}: ChatToastProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const isDestructive =
    message.toLowerCase().includes('error') ||
    message.toLowerCase().includes('failed') ||
    message.toLowerCase().includes('blocked');

  const iconName = isDestructive ? 'alert-circle' : icon;
  const iconColor = isDestructive ? '#ef4444' : colors.primary;

  return (
    <View pointerEvents="none" style={[styles.container, { top: insets.top + 54 }]}>
      <Animated.View
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(200)}
        style={[
          styles.toastPill,
          {
            backgroundColor: isDark ? 'rgba(28, 28, 34, 0.95)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: isDark ? '#33333d' : '#e5e7eb',
          },
        ]}
      >
        <Ionicons name={iconName} size={17} color={iconColor} style={styles.icon} />
        <Text style={[styles.messageText, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  icon: {
    marginRight: 8,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});
