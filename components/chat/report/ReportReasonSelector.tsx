import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { REPORT_REASONS } from './types';
import { styles } from './styles';

interface ReportReasonSelectorProps {
  selectedReason: string;
  onSelectReason: (reason: string) => void;
  isDark: boolean;
  colors: { text: string; placeholder: string; primary: string; primarySoft: string };
}

export function ReportReasonSelector({
  selectedReason,
  onSelectReason,
  isDark,
  colors,
}: ReportReasonSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>SELECT REASON</Text>
      {REPORT_REASONS.map((r) => {
        const isSelected = selectedReason === r.label;
        return (
          <TouchableOpacity
            key={r.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelectReason(r.label);
            }}
            style={[
              styles.radioRow,
              isSelected && { backgroundColor: isDark ? '#2e1017' : colors.primarySoft },
            ]}
          >
            <Ionicons
              name={isSelected ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={isSelected ? colors.primary : colors.placeholder}
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.radioLabel,
                { color: colors.text },
                isSelected && { fontWeight: '700', color: colors.primary },
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
