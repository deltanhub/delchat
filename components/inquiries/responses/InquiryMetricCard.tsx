import React from 'react';
import { View, Text } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { InquiryMetricCardProps } from './types';

export const InquiryMetricCard: React.FC<InquiryMetricCardProps> = ({
  totalCount,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? '#27272a' : colors.border,
        },
      ]}
    >
      <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
        TOTAL INQUIRY RESPONSES
      </Text>
      <Text style={[styles.metricValue, { color: colors.primary }]}>{totalCount}</Text>
    </View>
  );
};
