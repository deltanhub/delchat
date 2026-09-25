import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { LeadsRestrictedViewProps } from './types';

export const LeadsRestrictedView: React.FC<LeadsRestrictedViewProps> = ({
  onReturnToInbox,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.restrictedContainer, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Ionicons
        name="shield-outline"
        size={48}
        color={colors.primary}
        style={{ marginBottom: 16 }}
      />
      <Text style={[styles.restrictedTitle, { color: colors.text }]}>
        Brokerage CRM Restricted
      </Text>
      <Text style={[styles.restrictedSubtitle, { color: colors.placeholder }]}>
        The Leads CRM workspace is reserved for licensed real estate professionals and property hosts.
      </Text>
      <ScalePressable
        onPress={onReturnToInbox}
        style={[styles.restrictedBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.restrictedBtnText}>Return to Inbox</Text>
      </ScalePressable>
    </View>
  );
};
