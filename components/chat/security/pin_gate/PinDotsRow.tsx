import React from 'react';
import { View, Animated } from 'react-native';
import { styles } from './styles';
import { PinDotsRowProps } from './types';

export function PinDotsRow({
  targetLength,
  pinLength,
  shakeAnim,
  isDark,
}: PinDotsRowProps) {
  const dots = Array.from({ length: targetLength }, (_, i) => i);

  return (
    <Animated.View
      style={[
        styles.dotsRow,
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      {dots.map((idx) => {
        const isFilled = pinLength > idx;
        return (
          <View
            key={idx}
            style={[
              styles.dot,
              {
                backgroundColor: isFilled ? '#4a0f1f' : 'transparent',
                borderColor: isFilled
                  ? '#4a0f1f'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.25)'
                  : '#cbd5e1',
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}
