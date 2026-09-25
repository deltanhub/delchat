import React from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';
import ScalePressable from '../../ScalePressable';

export interface AssignmentSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  errorMessage?: string | null;
  colors: any;
  isDark: boolean;
}

export default function AssignmentSearchBar({
  searchQuery,
  setSearchQuery,
  errorMessage,
  colors,
  isDark,
}: AssignmentSearchBarProps) {
  return (
    <>
      {errorMessage && (
        <View style={[styles.errorBanner, { backgroundColor: isDark ? '#3D1418' : '#FEE2E2' }]}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={[styles.searchBox, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        <Ionicons name="search" size={16} color={colors.placeholder} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name, role, or email..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <ScalePressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.placeholder} />
          </ScalePressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorText: { fontSize: Typography.sizes.xs, color: '#ef4444', flex: 1, fontWeight: '500' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: Typography.sizes.sm, paddingVertical: 0 },
});
