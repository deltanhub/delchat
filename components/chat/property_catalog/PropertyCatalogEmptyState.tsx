import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface PropertyCatalogEmptyStateProps {
  searchQuery: string;
  colors: { text: string; placeholder: string };
}

export function PropertyCatalogEmptyState({ searchQuery, colors }: PropertyCatalogEmptyStateProps) {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="home-outline" size={48} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Properties Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
        {searchQuery ? 'Try another search term' : 'No active listings in your catalog'}
      </Text>
    </View>
  );
}
