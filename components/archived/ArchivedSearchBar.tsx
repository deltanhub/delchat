import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { ArchivedSearchBarProps } from './types';

export function ArchivedSearchBar({
  searchQuery,
  setSearchQuery,
  colors,
  isDark,
}: ArchivedSearchBarProps) {
  return (
    <View
      style={[
        styles.searchBar,
        { backgroundColor: isDark ? '#1f1f1f' : '#e8edf3', borderColor: colors.border },
      ]}
    >
      <Ionicons name="search" size={16} color={colors.placeholder} style={{ marginRight: 8 }} />
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search archived chats..."
        placeholderTextColor={colors.placeholder}
        style={[styles.searchInput, { color: colors.text }]}
        clearButtonMode="while-editing"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={16} color={colors.placeholder} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default ArchivedSearchBar;
