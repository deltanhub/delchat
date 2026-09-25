import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import {
  InquiryFormBubbleProps,
  styles,
  InquiryHeader,
  InquiryFormFieldList,
  InquiryLegalDisclaimer,
} from './inquiry_form';

export { InquiryFormBubbleProps };

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
        <InquiryHeader
          title={form.title}
          description={form.description}
          isDark={isDark}
        />

        <View style={styles.inquiryFormBody}>
          <InquiryFormFieldList
            fields={fields}
            formAnswers={formAnswers}
            setFormAnswers={setFormAnswers}
            formSubmitted={formSubmitted}
            textColor={colors.text}
            placeholderColor={colors.placeholder}
            borderColor={colors.border}
            primaryColor={colors.primary}
            isDark={isDark}
          />

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

          <InquiryLegalDisclaimer
            placeholderColor={colors.placeholder}
            isDark={isDark}
          />
        </View>
      </View>
    </View>
  );
}
