import React from 'react';
import { Text, Pressable } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { MuteDurationCancelButtonProps } from './types';

export const MuteDurationCancelButton: React.FC<MuteDurationCancelButtonProps> = ({
  onClose,
  textColor,
  isDark,
}) => {
  return (
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
      <Text style={[styles.cancelText, { color: textColor }]}>Cancel</Text>
    </Pressable>
  );
};
