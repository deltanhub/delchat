import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface InquiryLegalDisclaimerProps {
  placeholderColor: string;
  isDark: boolean;
}

export default function InquiryLegalDisclaimer({
  placeholderColor,
  isDark,
}: InquiryLegalDisclaimerProps) {
  return (
    <View style={[styles.disclaimerRow, { borderTopColor: isDark ? '#27272a' : '#f0e6e9' }]}>
      <Ionicons
        name="information-circle-outline"
        size={12}
        color={placeholderColor}
        style={{ marginTop: 1 }}
      />
      <Text style={[styles.disclaimerText, { color: placeholderColor }]}>
        Information provided will be securely transmitted to the listing agent/developer and DeltanHub verification desk.
      </Text>
    </View>
  );
}
