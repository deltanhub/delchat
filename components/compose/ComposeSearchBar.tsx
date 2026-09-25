import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';
import { ComposeSearchBarProps } from './types';

export default function ComposeSearchBar({
  value,
  onChangeText,
  isDark,
  colors,
  placeholder = 'Search by username, name, or email...',
}: ComposeSearchBarProps) {
  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[styles.searchInput, { color: colors.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <ScalePressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.placeholder} />
        </ScalePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    padding: 0,
  },
});
