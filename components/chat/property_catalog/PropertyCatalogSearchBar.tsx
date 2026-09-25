import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface PropertyCatalogSearchBarProps {
  searchQuery: string;
  isDark: boolean;
  colors: { text: string; placeholder: string };
  onChangeText: (text: string) => void;
}

export function PropertyCatalogSearchBar({
  searchQuery,
  isDark,
  colors,
  onChangeText,
}: PropertyCatalogSearchBarProps) {
  return (
    <View
      style={[
        styles.searchBar,
        {
          backgroundColor: isDark ? '#202024' : '#f3f4f6',
          borderColor: isDark ? '#2e2e33' : '#e5e7eb',
        },
      ]}
    >
      <Ionicons name="search" size={17} color={colors.placeholder} style={{ marginRight: 8 }} />
      <TextInput
        value={searchQuery}
        onChangeText={onChangeText}
        placeholder="Search properties by title, city, or ref..."
        placeholderTextColor={colors.placeholder}
        style={[styles.searchInput, { color: colors.text }]}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  );
}
