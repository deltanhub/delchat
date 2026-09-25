import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';
import { SettingsHeaderProps } from './types';

export function SettingsHeader({ colors }: SettingsHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
        Customize your DelChat preferences
      </Text>
    </View>
  );
}

export default SettingsHeader;
