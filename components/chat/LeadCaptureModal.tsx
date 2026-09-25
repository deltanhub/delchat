import React from 'react';
import {
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '../useColorScheme';
import {
  LeadCaptureHeader,
  LeadCaptureFormFields,
  LeadCaptureActions,
  useLeadCapture,
  styles,
} from './lead_capture';
import type { LeadCaptureModalProps } from './lead_capture/types';

export type { LeadCaptureModalProps };

export default function LeadCaptureModal({
  visible,
  onClose,
  onSubmit,
  initialFullName = '',
  initialEmail = '',
  initialPhone = '',
}: LeadCaptureModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const {
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
  } = useLeadCapture({
    visible,
    onSubmit,
    onClose,
    initialFullName,
    initialEmail,
    initialPhone,
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#121218' : '#ffffff',
              borderTopColor: isDark ? '#262630' : '#e5e7eb',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          <LeadCaptureHeader isDark={isDark} onClose={onClose} />

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LeadCaptureFormFields
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              note={note}
              setNote={setNote}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              isDark={isDark}
            />

            <LeadCaptureActions
              isSubmitting={isSubmitting}
              isDark={isDark}
              onClose={onClose}
              onSubmit={handleSubmit}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
