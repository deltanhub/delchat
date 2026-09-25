import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { CHAT_LEAD_STATUS_OPTIONS } from '../types';
import { styles } from './styles';
import { ChatLeadsPipelineBarProps } from './types';

export function ChatLeadsPipelineBar({
  filterStatus,
  onSelectStatus,
  partitionedChatLeads,
  primaryColor,
  textColor,
  borderColor,
}: ChatLeadsPipelineBarProps) {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: borderColor }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {CHAT_LEAD_STATUS_OPTIONS.map((st) => {
          const isActive = filterStatus === st.value;
          const count =
            st.value === 'all'
              ? partitionedChatLeads.length
              : partitionedChatLeads.filter((l) => l.status === st.value).length;
          return (
            <TouchableOpacity
              key={st.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectStatus(st.value);
              }}
              style={[styles.filterChip, isActive && { backgroundColor: primaryColor }]}
            >
              <Text style={[styles.filterChipText, { color: isActive ? '#ffffff' : textColor }]}>
                {st.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
