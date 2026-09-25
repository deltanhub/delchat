import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';
import { ComposeModeToggleProps } from './types';

export default function ComposeModeToggle({
  mode,
  onModeChange,
  colors,
  isDark = true,
}: ComposeModeToggleProps) {
  const isDirect = mode === 'direct';
  const isGroup = mode === 'group';

  const activeTextColor = '#ffffff';
  const inactiveTextColor = isDark ? '#ffffff' : colors.text;

  return (
    <View style={styles.toggleContainer}>
      <ScalePressable
        onPress={() => onModeChange('direct')}
        containerStyle={styles.togglePressable}
        style={[
          styles.toggleButton,
          {
            backgroundColor: isDirect ? colors.primary : 'transparent',
            borderColor: isDirect ? colors.primary : (isDark ? '#333333' : colors.border),
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Direct Chat"
      >
        <Text
          style={[
            styles.toggleText,
            {
              color: isDirect ? activeTextColor : inactiveTextColor,
              opacity: isDirect ? 1 : 0.85,
            },
          ]}
        >
          Direct Chat
        </Text>
      </ScalePressable>

      <ScalePressable
        onPress={() => onModeChange('group')}
        containerStyle={styles.togglePressable}
        style={[
          styles.toggleButton,
          {
            backgroundColor: isGroup ? colors.primary : 'transparent',
            borderColor: isGroup ? colors.primary : (isDark ? '#333333' : colors.border),
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Group Chat"
      >
        <Text
          style={[
            styles.toggleText,
            {
              color: isGroup ? activeTextColor : inactiveTextColor,
              opacity: isGroup ? 1 : 0.85,
            },
          ]}
        >
          Group Chat
        </Text>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 12,
  },
  togglePressable: {
    flex: 1,
  },
  toggleButton: {
    width: '100%',
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  toggleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
});
