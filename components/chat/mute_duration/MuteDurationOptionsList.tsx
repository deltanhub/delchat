import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DURATION_OPTIONS } from './constants';
import { styles } from './styles';
import { MuteDurationOptionsListProps } from './types';

export const MuteDurationOptionsList: React.FC<MuteDurationOptionsListProps> = ({
  onSelect,
  textColor,
  primaryColor,
  isDark,
}) => {
  return (
    <View style={styles.optionsContainer}>
      {DURATION_OPTIONS.map((option, index) => (
        <Pressable
          key={option.key}
          style={({ pressed }) => [
            styles.optionRow,
            {
              backgroundColor: pressed
                ? (isDark ? 'rgba(74, 15, 31, 0.25)' : '#f4e7eb')
                : 'transparent',
              borderBottomColor: isDark ? '#262626' : '#f0f0f0',
              borderBottomWidth: index < DURATION_OPTIONS.length - 1 ? 1 : 0,
            },
          ]}
          onPress={() => onSelect(option.key)}
        >
          <View
            style={[
              styles.optionIconWrap,
              { backgroundColor: isDark ? 'rgba(74, 15, 31, 0.35)' : '#f4e7eb' },
            ]}
          >
            <Ionicons
              name={option.icon as any}
              size={20}
              color={primaryColor}
            />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={[styles.optionLabel, { color: textColor }]}>
              {option.label}
            </Text>
            <Text style={[styles.optionSubtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
              {option.subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#c0c0c0'} />
        </Pressable>
      ))}
    </View>
  );
};
