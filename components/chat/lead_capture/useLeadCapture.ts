import { useState, useEffect, useCallback } from 'react';
import * as Haptics from '../../../lib/haptics';
import type { LeadDraft } from './types';

interface UseLeadCaptureOptions {
  visible: boolean;
  onSubmit: (draft: LeadDraft) => Promise<void>;
  onClose: () => void;
  initialFullName?: string;
  initialEmail?: string;
  initialPhone?: string;
}

export function useLeadCapture({
  visible,
  onSubmit,
  onClose,
  initialFullName = '',
  initialEmail = '',
  initialPhone = '',
}: UseLeadCaptureOptions) {
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setFullName(initialFullName);
      setEmail(initialEmail);
      setPhone(initialPhone);
      setNote('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [visible, initialFullName, initialEmail, initialPhone]);

  const handleSubmit = useCallback(async () => {
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        note: note.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to create the lead right now.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [fullName, email, phone, note, onSubmit, onClose]);

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    note,
    setNote,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    handleSubmit,
  };
}
