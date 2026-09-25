import React from 'react';
import { Modal, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  styles,
  useReportForm,
  ReportHeader,
  ReportReasonSelector,
  ReportDetailsInput,
  ReportConsentToggle,
  ReportActionButtons,
} from './report';

export interface ReportModalProps {
  visible: boolean;
  targetName: string;
  agencyName?: string | null;
  isAssignedAgentReport?: boolean;
  onClose: () => void;
  onSubmitReport: (reason: string, details: string, messagesConsent: boolean) => Promise<void>;
}

/**
 * ReportModal
 * Clean Architecture slim presenter for submitting conversation and agent moderation reports.
 * Supports granular "Reveal Chat History for Review" (messagesConsent) authorization toggle.
 */
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

  const {
    selectedReason,
    setSelectedReason,
    details,
    setDetails,
    messagesConsent,
    setMessagesConsent,
    isSubmitting,
    handleSubmit,
  } = useReportForm(onSubmitReport, onClose);

  if (!visible) return null;

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
          <ReportHeader
            targetName={targetName}
            agencyName={agencyName}
            isAssignedAgentReport={isAssignedAgentReport}
            colors={colors}
            onClose={onClose}
          />

          <ReportReasonSelector
            selectedReason={selectedReason}
            onSelectReason={setSelectedReason}
            isDark={isDark}
            colors={colors}
          />

          <ReportDetailsInput
            details={details}
            onChangeDetails={setDetails}
            agencyName={agencyName}
            isDark={isDark}
            colors={colors}
          />

          <ReportConsentToggle
            messagesConsent={messagesConsent}
            onToggleConsent={setMessagesConsent}
            agencyName={agencyName}
            isDark={isDark}
            colors={colors}
          />

          <ReportActionButtons
            isSubmitting={isSubmitting}
            onCancel={onClose}
            onSubmit={handleSubmit}
            isDark={isDark}
            colors={colors}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
