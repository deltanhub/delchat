import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Unsolicited Ads' },
  { id: 'scam', label: 'Fraudulent Listing or Scam' },
  { id: 'harassment', label: 'Harassment or Inappropriate Behavior' },
  { id: 'unresponsive', label: 'Misleading Contact Information' },
  { id: 'other', label: 'Other Policy Violation' },
];

export interface ReportModalProps {
  visible: boolean;
  targetName: string;
  agencyName?: string | null;
  isAssignedAgentReport?: boolean;
  onClose: () => void;
  onSubmitReport: (reason: string, details: string, messagesConsent: boolean) => Promise<void>;
}

export default function ReportModal({
  visible,
  targetName,
  agencyName,
  isAssignedAgentReport = false,
  onClose,
  onSubmitReport,
}: ReportModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].label);
  const [details, setDetails] = useState('');
  const [messagesConsent, setMessagesConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    try {
      await onSubmitReport(selectedReason, details.trim(), messagesConsent);
      setDetails('');
      setMessagesConsent(false);
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlayDismiss} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1a1a1e' : '#ffffff',
              borderColor: isDark ? '#2c2c32' : '#e5e7eb',
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                {isAssignedAgentReport || agencyName ? 'Report Agent' : 'Report Conversation'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.placeholder }]} numberOfLines={2}>
                {isAssignedAgentReport || agencyName
                  ? `Report ${targetName} to ${agencyName || 'supervising firm'} management`
                  : `Report ${targetName} for moderation review`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Reason Radio Group */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>SELECT REASON</Text>
            {REPORT_REASONS.map((r) => {
              const isSelected = selectedReason === r.label;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedReason(r.label);
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

          {/* Details Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>ADDITIONAL DETAILS (OPTIONAL)</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder={
                agencyName
                  ? `Provide context for ${agencyName} management to investigate...`
                  : 'Provide context for our trust and safety team...'
              }
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

          {/* Reveal Chat History / Messages Consent Toggle Section */}
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMessagesConsent((prev) => !prev);
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
                    {messagesConsent
                      ? `I consent to allow ${agencyName ? agencyName + ' management' : 'supervising management'} to read messages in this thread to investigate and take action.`
                      : 'Keep messages private. Only your complaint reason and details will be submitted without granting access to chat history.'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: isDark ? '#33333b' : '#e5e7eb' }]}>
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: Typography.fontFamily,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  radioLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  textArea: {
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    textAlignVertical: 'top',
  },
  consentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  consentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  consentSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: Typography.fontFamily,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  submitBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
});
