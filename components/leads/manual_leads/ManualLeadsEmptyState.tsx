import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import type { ManualLeadsEmptyStateProps } from './types';

export const ManualLeadsEmptyState: React.FC<ManualLeadsEmptyStateProps> = ({
  colors,
}) => {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="person-add-outline" size={54} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Manual Leads Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
        Press "+ Add Lead" above to record prospective buyers and coordinate follow-up.
      </Text>
    </View>
  );
};
