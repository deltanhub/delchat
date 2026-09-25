import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';

export const InternalNotesEmptyState: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.centerContainer}>
      <View style={[styles.emptyLockCircle, { backgroundColor: isDark ? '#382006' : '#fef3c7' }]}>
        <Ionicons name="lock-closed" size={32} color="#f59e0b" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Internal Notes</Text>
      <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
        Notes added here are strictly private to licensed brokerage staff. The client will never see these messages.
      </Text>
    </View>
  );
};
