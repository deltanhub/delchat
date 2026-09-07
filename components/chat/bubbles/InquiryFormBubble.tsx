import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Switch, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage } from './types';

interface InquiryFormBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onSendInquiryResponse?: (answers: Record<string, any>) => void;
}

export default function InquiryFormBubble({
  message,
  isCurrentUser,
  onSendInquiryResponse,
}: InquiryFormBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const form = message.inquiryFormCard;
  if (!form) return null;
  const fields = form.fields || [];

  const handleFormSubmit = () => {
    if (formSubmitted) return;

    for (const field of fields) {
      if (field.isRequired && (formAnswers[field.id] === undefined || formAnswers[field.id] === '')) {
        Alert.alert('Required Field', `Please complete the required field: ${field.fieldLabel}`);
        return;
      }
    }

    setFormSubmitted(true);
    if (onSendInquiryResponse) {
      onSendInquiryResponse({
        templateId: form.templateId,
        templateTitle: form.title,
        answers: fields.map((f) => ({
          label: f.fieldLabel,
          value: formAnswers[f.id] !== undefined ? formAnswers[f.id] : '',
        })),
      });
    }
  };

  return (
    <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
      <View style={[styles.inquiryCard, { backgroundColor: colors.card, borderColor: isDark ? '#3a1a24' : '#efe3e8' }]}>
        <View style={[styles.inquiryHeader, { backgroundColor: isDark ? '#1f1318' : '#fdf6f8', borderBottomColor: isDark ? '#3a1a24' : '#efe3e8' }]}>
          <Ionicons name="clipboard-outline" size={18} color={isDark ? '#ffffff' : '#4a0f1f'} style={{ marginRight: 6 }} />
          <Text style={[styles.inquiryHeaderTitle, { color: isDark ? '#ffffff' : '#4a0f1f' }]}>{form.title || 'Inquiry Form'}</Text>
        </View>
        {form.description && <Text style={[styles.inquiryDesc, { color: isDark ? '#d1d5db' : '#5f5360' }]}>{form.description}</Text>}

        <View style={styles.inquiryFormBody}>
          {fields.map((field) => (
            <View key={field.id} style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {field.fieldLabel} {field.isRequired && <Text style={{ color: '#a4243b' }}>*</Text>}
              </Text>

              {field.fieldType === 'boolean' ? (
                <View style={styles.switchRow}>
                  <Switch
                    value={Boolean(formAnswers[field.id])}
                    onValueChange={(val) => setFormAnswers((prev) => ({ ...prev, [field.id]: val }))}
                    trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: colors.primary }}
                    thumbColor="#ffffff"
                    disabled={formSubmitted}
                  />
                  <Text style={[styles.switchText, { color: colors.text }]}>
                    {formAnswers[field.id] ? 'Yes' : 'No'}
                  </Text>
                </View>
              ) : (
                <TextInput
                  value={formAnswers[field.id] !== undefined ? String(formAnswers[field.id]) : ''}
                  onChangeText={(val) => setFormAnswers((prev) => ({ ...prev, [field.id]: val }))}
                  placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                  placeholderTextColor={colors.placeholder}
                  keyboardType={field.fieldType === 'number' ? 'numeric' : 'default'}
                  editable={!formSubmitted}
                  style={[
                    styles.fieldInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: isDark ? '#1c1c1e' : '#fcf8f9',
                      color: colors.text,
                    },
                  ]}
                />
              )}
            </View>
          ))}

          {/* Submit Button */}
          <Pressable
            onPress={handleFormSubmit}
            disabled={formSubmitted}
            style={({ pressed }) => [
              styles.formSubmitBtn,
              {
                backgroundColor: formSubmitted ? (isDark ? '#27272a' : '#cbd5e1') : colors.primary,
                opacity: pressed && !formSubmitted ? 0.9 : 1,
                transform: [{ scale: pressed && !formSubmitted ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={styles.formSubmitBtnText}>
              {formSubmitted ? 'Form Submitted ✓' : 'Submit Form'}
            </Text>
          </Pressable>

          {/* Legal Disclaimer */}
          <View style={[styles.disclaimerRow, { borderTopColor: isDark ? '#27272a' : '#f0e6e9' }]}>
            <Ionicons name="information-circle-outline" size={12} color={colors.placeholder} style={{ marginTop: 1 }} />
            <Text style={[styles.disclaimerText, { color: colors.placeholder }]}>
              Information provided will be securely transmitted to the listing agent/developer and DeltanHub verification desk.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  justifyRight: {
    justifyContent: 'flex-end',
  },
  justifyLeft: {
    justifyContent: 'flex-start',
  },
  inquiryCard: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf6f8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#efe3e8',
  },
  inquiryHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4a0f1f',
  },
  inquiryDesc: {
    fontSize: 12,
    color: '#5f5360',
    paddingHorizontal: 16,
    paddingTop: 10,
    lineHeight: 16,
  },
  inquiryFormBody: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formSubmitBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  formSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily,
  },
});
