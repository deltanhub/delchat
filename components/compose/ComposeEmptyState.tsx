import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { ComposeEmptyStateProps } from './types';

export default function ComposeEmptyState({
  isSearching,
  searchError,
  searchValue,
  colors,
}: ComposeEmptyStateProps) {
  if (isSearching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (searchError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.infoText, { color: colors.placeholder }]}>{searchError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <Ionicons name="people-outline" size={48} color={colors.placeholder} style={{ marginBottom: 12 }} />
      <Text style={[styles.infoText, { color: colors.placeholder }]}>
        {searchValue.trim().length < 2
          ? 'Type at least 2 characters to search by username, name, or email'
          : 'No contacts found'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
});
