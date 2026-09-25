import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './styles';

interface ReportActionButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  isDark: boolean;
  colors: { text: string };
}

export function ReportActionButtons({
  isSubmitting,
  onCancel,
  onSubmit,
  isDark,
  colors,
}: ReportActionButtonsProps) {
  return (
    <View style={styles.buttonRow}>
      <TouchableOpacity
        onPress={onCancel}
        style={[styles.cancelBtn, { borderColor: isDark ? '#33333b' : '#e5e7eb' }]}
      >
        <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSubmit}
        disabled={isSubmitting}
        style={[styles.submitBtn, { backgroundColor: '#dc2626' }]}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
