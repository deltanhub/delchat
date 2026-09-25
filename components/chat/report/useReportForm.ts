import { useState } from 'react';
import * as Haptics from '../../../lib/haptics';
import { REPORT_REASONS } from './types';

export function useReportForm(
  onSubmitReport: (reason: string, details: string, messagesConsent: boolean) => Promise<void>,
  onClose: () => void
) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].label);
  const [details, setDetails] = useState('');
  const [messagesConsent, setMessagesConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return {
    selectedReason,
    setSelectedReason,
    details,
    setDetails,
    messagesConsent,
    setMessagesConsent,
    isSubmitting,
    handleSubmit,
  };
}
