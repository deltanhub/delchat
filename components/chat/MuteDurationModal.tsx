import React from 'react';
import { Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useColorScheme } from '../useColorScheme';
import Colors from '../../constants/Colors';
import * as Haptics from '../../lib/haptics';
import {
  MuteDuration,
  MuteDurationModalProps,
  styles,
  MuteDurationHeader,
  MuteDurationOptionsList,
  MuteDurationCancelButton,
} from './mute_duration';

export type { MuteDuration, MuteDurationModalProps };

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
          <MuteDurationHeader
            textColor={colors.text}
            primaryColor={colors.primary}
            isDark={isDark}
          />

          <MuteDurationOptionsList
            onSelect={handleSelect}
            textColor={colors.text}
            primaryColor={colors.primary}
            isDark={isDark}
          />

          <MuteDurationCancelButton
            onClose={onClose}
            textColor={colors.text}
            isDark={isDark}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
