import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { InquiryFilterBarProps } from './types';

export const InquiryFilterBar: React.FC<InquiryFilterBarProps> = ({
  filterOptions,
  activeFilter,
  onSelectFilter,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.filterRow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filterOptions.map((opt) => {
          const isSelected = activeFilter === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => onSelectFilter(opt.key)}
              style={[
                styles.filterChip,
                isSelected
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : {
                      backgroundColor: colors.card,
                      borderColor: isDark ? '#27272a' : colors.border,
                    },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isSelected ? '#ffffff' : colors.text },
                ]}
              >
                {opt.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.25)'
                      : isDark ? '#27272a' : '#f0e5e9',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    { color: isSelected ? '#ffffff' : colors.primary },
                  ]}
                >
                  {opt.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
