import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';

interface LeadCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: {
    fullName: string;
    email: string;
    phone: string;
    note: string;
  }) => Promise<void>;
  initialFullName?: string;
  initialEmail?: string;
  initialPhone?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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

  if (!visible) return null;

  const handleSubmit = async () => {
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
  };

  const inputBg = isDark ? '#1a1a22' : '#f4f6f8';
  const inputBorder = isDark ? '#2e2e3a' : '#e2e8f0';

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
          {/* Top Drag Indicator */}
          <View style={styles.dragHandleContainer}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isDark ? '#383848' : '#cbd5e1' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Create lead
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
                Capture a new contact directly from this conversation.
              </Text>
            </View>
            <ScalePressable
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#22222c' : '#f1f5f9' },
              ]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </ScalePressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Error Banner */}
            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? '#2d1419' : '#fff5f6',
                    borderColor: isDark ? '#5c1d29' : '#fed7dd',
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color="#e11d48" style={{ marginRight: 6 }} />
                <Text style={[styles.errorText, { color: isDark ? '#fda4af' : '#be123c' }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Field: Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Full name</Text>
              <TextInput
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Lead full name"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.textInput,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text },
                ]}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Field: Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(val) => setEmail(val)}
                placeholder="lead@example.com"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.textInput,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text },
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Field: Phone */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={(val) => setPhone(val)}
                placeholder="+234..."
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.textInput,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text },
                ]}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            {/* Field: Note */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Note</Text>
              <TextInput
                value={note}
                onChangeText={(val) => setNote(val)}
                placeholder="Optional lead context from the chat"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text },
                ]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <ScalePressable
                onPress={onClose}
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: isDark ? '#1e1e28' : '#f1f5f9',
                    borderColor: isDark ? '#2e2e3e' : '#e2e8f0',
                  },
                ]}
                disabled={isSubmitting}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </ScalePressable>

              <ScalePressable
                onPress={handleSubmit}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && { opacity: 0.7 },
                ]}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryButtonText}>Create lead</Text>
                  </>
                )}
              </ScalePressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 8,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
    fontFamily: Typography.fontFamily,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  textInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    paddingBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  primaryButton: {
    flex: 2,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
});
