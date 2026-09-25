import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';

export const InquiryEmptyState: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1c1917' : '#fdf6f8' }]}>
        <Ionicons name="document-text-outline" size={32} color={colors.placeholder} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No responses found</Text>
      <Text style={[styles.emptySub, { color: colors.placeholder }]}>
        Responses from chat inquiry questionnaires will appear here.
      </Text>
    </View>
  );
};
