import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';

interface ReportConsentToggleProps {
  messagesConsent: boolean;
  onToggleConsent: (val: boolean | ((prev: boolean) => boolean)) => void;
  agencyName?: string | null;
  isDark: boolean;
  colors: { text: string; placeholder: string; primary: string };
}

export function ReportConsentToggle({
  messagesConsent,
  onToggleConsent,
  agencyName,
  isDark,
  colors,
}: ReportConsentToggleProps) {
  const consentSubtitle = messagesConsent
    ? `I consent to allow ${agencyName ? agencyName + ' management' : 'supervising management'} to read messages in this thread to investigate and take action.`
    : 'Keep messages private. Only your complaint reason and details will be submitted without granting access to chat history.';

  return (
    <View style={styles.section}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggleConsent((prev) => !prev);
        }}
        style={[
          styles.consentCard,
          {
            backgroundColor: messagesConsent
              ? (isDark ? '#2c1219' : '#fef2f4')
              : (isDark ? '#24242a' : '#f9fafb'),
            borderColor: messagesConsent
              ? colors.primary
              : (isDark ? '#33333b' : '#e5e7eb'),
          },
        ]}
      >
        <View style={styles.consentHeaderRow}>
          <Ionicons
            name={messagesConsent ? 'checkbox' : 'square-outline'}
            size={20}
            color={messagesConsent ? colors.primary : colors.placeholder}
            style={{ marginRight: 10, marginTop: 1 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.consentTitle, { color: colors.text }]}>
              Reveal Chat History for Review
            </Text>
            <Text style={[styles.consentSubtitle, { color: isDark ? '#d1d5db' : '#5f6f83' }]}>
              {consentSubtitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
