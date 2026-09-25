import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import type { ManualLeadActionBarProps } from './types';

export const ManualLeadActionBar: React.FC<ManualLeadActionBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddLead,
  colors,
  isDark,
}) => {
  return (
    <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
      <View
        style={[
          styles.searchBox,
          { backgroundColor: isDark ? '#262626' : '#f8fafc', borderColor: colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={16} color={colors.placeholder} style={{ marginRight: 6 }} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search leads, phone, properties..."
          placeholderTextColor={colors.placeholder}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onOpenAddLead();
        }}
        style={[styles.addLeadBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
        <Text style={styles.addLeadBtnText}>Add Lead</Text>
      </TouchableOpacity>
    </View>
  );
};
