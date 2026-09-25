import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { columnTabsStyles } from './columnTabsStyles';

export interface AssignmentColumnTabButtonProps {
  label: string;
  subLabel: string;
  iconName: keyof typeof Ionicons.glyphMap;
  count: number;
  isActive: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
  accessibilityLabel: string;
}

export function AssignmentColumnTabButton({
  label,
  subLabel,
  iconName,
  count,
  isActive,
  onPress,
  colors,
  isDark,
  accessibilityLabel,
}: AssignmentColumnTabButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        columnTabsStyles.columnTab,
        {
          backgroundColor: isActive
            ? isDark ? '#3a0b18' : colors.primarySoft
            : isDark ? '#18181b' : '#f8fafc',
          borderColor: isActive ? colors.primary : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={columnTabsStyles.columnTabContent}>
        <View style={columnTabsStyles.columnTabHeader}>
          <Ionicons
            name={iconName}
            size={16}
            color={isActive ? colors.primary : colors.placeholder}
          />
          <Text
            style={[
              columnTabsStyles.columnTabTitle,
              { color: isActive ? colors.primary : colors.text },
              isActive && { fontWeight: '700' },
            ]}
          >
            {label}
          </Text>
        </View>
        <View
          style={[
            columnTabsStyles.columnBadge,
            {
              backgroundColor: isActive
                ? colors.primary
                : isDark ? '#27272a' : '#e2e8f0',
            },
          ]}
        >
          <Text
            style={[
              columnTabsStyles.columnBadgeText,
              { color: isActive ? '#ffffff' : colors.placeholder },
            ]}
          >
            {count}
          </Text>
        </View>
      </View>
      <Text
        style={[
          columnTabsStyles.columnSubLabel,
          { color: isActive ? colors.primaryMuted : colors.placeholder },
        ]}
        numberOfLines={1}
      >
        {subLabel}
      </Text>
    </TouchableOpacity>
  );
}

export default AssignmentColumnTabButton;
