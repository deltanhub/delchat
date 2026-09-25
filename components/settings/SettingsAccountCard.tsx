import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { styles } from './styles';
import { SettingsAccountCardProps } from './types';

export function SettingsAccountCard({
  colors,
  onSignOut,
}: SettingsAccountCardProps) {
  return (
    <>
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Account</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ScalePressable
          onPress={onSignOut}
          style={styles.signOutRow}
          accessibilityLabel="Sign out of DelChat"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </ScalePressable>
      </View>
    </>
  );
}

export default SettingsAccountCard;
