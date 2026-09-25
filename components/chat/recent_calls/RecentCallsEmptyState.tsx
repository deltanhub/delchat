import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { RecentCallsEmptyStateProps } from './types';

export const RecentCallsEmptyState: React.FC<RecentCallsEmptyStateProps> = ({
  loading,
  error,
  searchQuery,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={isDark ? '#f87171' : '#9d263d'}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Unable to load call logs
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <Ionicons name="call-outline" size={52} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Recent Calls
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
        {searchQuery
          ? 'No call records matched your search.'
          : 'Calls you place or receive will show up here.'}
      </Text>
    </View>
  );
};
