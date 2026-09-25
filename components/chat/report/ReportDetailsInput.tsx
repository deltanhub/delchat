import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './styles';

interface ReportDetailsInputProps {
  details: string;
  onChangeDetails: (val: string) => void;
  agencyName?: string | null;
  isDark: boolean;
  colors: { text: string; placeholder: string };
}

export function ReportDetailsInput({
  details,
  onChangeDetails,
  agencyName,
  isDark,
  colors,
}: ReportDetailsInputProps) {
  const placeholderText = agencyName
    ? `Provide context for ${agencyName} management to investigate...`
    : 'Provide context for our trust and safety team...';

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>ADDITIONAL DETAILS (OPTIONAL)</Text>
      <TextInput
        value={details}
        onChangeText={onChangeDetails}
        placeholder={placeholderText}
        placeholderTextColor={colors.placeholder}
        multiline
        numberOfLines={3}
        style={[
          styles.textArea,
          {
            backgroundColor: isDark ? '#24242a' : '#f3f4f6',
            borderColor: isDark ? '#33333b' : '#e5e7eb',
            color: colors.text,
          },
        ]}
      />
    </View>
  );
}
