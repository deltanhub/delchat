import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { ArchivedEmptyStateProps } from './types';

export function ArchivedEmptyState({
  searchQuery,
  colors,
}: ArchivedEmptyStateProps) {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="archive-outline" size={54} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Archived Chats</Text>
      <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
        {searchQuery
          ? 'No archived chats match your search query.'
          : 'Chats you archive will remain safely stored here.'}
      </Text>
    </View>
  );
}

export default ArchivedEmptyState;
