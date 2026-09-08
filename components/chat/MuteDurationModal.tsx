import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { useColorScheme } from '../../components/useColorScheme';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../lib/haptics';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import type { MuteDuration } from '../../lib/repositories/conversationRepository';

interface MuteDurationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (duration: MuteDuration) => void;
}

const DURATION_OPTIONS: { key: MuteDuration; label: string; icon: string; subtitle: string }[] = [
  { key: '8h', label: '8 Hours', icon: 'time-outline', subtitle: 'Mute until tonight' },
  { key: '1w', label: '1 Week', icon: 'calendar-outline', subtitle: 'Mute for 7 days' },
  { key: 'always', label: 'Always', icon: 'infinite-outline', subtitle: 'Until you turn it off' },
];

export default function MuteDurationModal({ visible, onClose, onSelect }: MuteDurationModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const handleSelect = (duration: MuteDuration) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(duration);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.springify().mass(1).stiffness(100).damping(15)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#333333' : '#e5e7eb',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Ionicons
              name="notifications-off"
              size={22}
              color={colors.primary}
              style={styles.headerIcon}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              Mute Notifications
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            Other participants will not see that you muted this chat. You will still be notified if mentioned.
          </Text>

          {/* Duration Options */}
          <View style={styles.optionsContainer}>
            {DURATION_OPTIONS.map((option, index) => (
              <Pressable
                key={option.key}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    backgroundColor: pressed
                      ? (isDark ? 'rgba(74, 15, 31, 0.25)' : '#f4e7eb')
                      : 'transparent',
                    borderBottomColor: isDark ? '#262626' : '#f0f0f0',
                    borderBottomWidth: index < DURATION_OPTIONS.length - 1 ? 1 : 0,
                  },
                ]}
                onPress={() => handleSelect(option.key)}
              >
                <View style={[
                  styles.optionIconWrap,
                  { backgroundColor: isDark ? 'rgba(74, 15, 31, 0.35)' : '#f4e7eb' },
                ]}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
                    {option.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#c0c0c0'} />
              </Pressable>
            ))}
          </View>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: pressed
                  ? (isDark ? '#262626' : '#f0f0f0')
                  : (isDark ? '#1e1e1e' : '#f8f8f8'),
                borderColor: isDark ? '#333333' : '#e5e7eb',
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamily,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.lineHeights.sm,
    marginBottom: 18,
  },
  optionsContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  optionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamily,
  },
});
