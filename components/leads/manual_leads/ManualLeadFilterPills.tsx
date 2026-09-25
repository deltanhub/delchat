import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { MANUAL_LEAD_STATUS_OPTIONS } from '../types';
import { styles } from './styles';
import type { ManualLeadFilterPillsProps } from './types';

export const ManualLeadFilterPills: React.FC<ManualLeadFilterPillsProps> = ({
  manualFilterStatus,
  onSelectStatus,
  manualLeads,
  colors,
}) => {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {MANUAL_LEAD_STATUS_OPTIONS.map((st) => {
          const isActive = manualFilterStatus === st.value;
          const count =
            st.value === 'all'
              ? manualLeads.length
              : manualLeads.filter((l) => l.status === st.value).length;
          return (
            <TouchableOpacity
              key={st.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectStatus(st.value);
              }}
              style={[styles.filterChip, isActive && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.filterChipText, { color: isActive ? '#ffffff' : colors.text }]}>
                {st.shortLabel} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
