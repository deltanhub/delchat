import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarredMessagesSearchBarProps } from './types';

export default function StarredMessagesSearchBar({
  searchQuery,
  onSearchChange,
  isDark,
  colors,
}: StarredMessagesSearchBarProps) {
  return (
    <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
      <View
        style={[
          styles.searchBar,
          { backgroundColor: isDark ? '#1e1e1e' : '#f1f5f9', borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={17} color={colors.placeholder} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search starred messages or senders..."
          placeholderTextColor={colors.placeholder}
          style={[styles.searchInput, { color: colors.text }]}
          clearButtonMode="while-editing"
          accessibilityLabel="Search starred messages"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={17} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
});
