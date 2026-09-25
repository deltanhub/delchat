import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { styles } from './styles';
import { ArchivedHeaderProps } from './types';

export function ArchivedHeader({
  insets,
  accentColor,
  colors,
  isDark,
  onBack,
}: ArchivedHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? '#121212' : '#ffffff',
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ScalePressable
        onPress={onBack}
        style={styles.backButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Back to chats"
      >
        <Ionicons name="chevron-back" size={24} color={accentColor} />
        <Text style={[styles.backText, { color: accentColor }]}>Chats</Text>
      </ScalePressable>

      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
        Archived Chats
      </Text>

      <View style={styles.headerRightSpacer} />
    </View>
  );
}

export default ArchivedHeader;
