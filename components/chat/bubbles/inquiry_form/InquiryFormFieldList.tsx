import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { styles } from './styles';

export interface InquiryFormField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
  isRequired: boolean;
  options?: string[];
}

interface InquiryFormFieldListProps {
  fields: InquiryFormField[];
  formAnswers: Record<string, any>;
  setFormAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formSubmitted: boolean;
  textColor: string;
  placeholderColor: string;
  borderColor: string;
  primaryColor: string;
  isDark: boolean;
}

export default function InquiryFormFieldList({
  fields,
  formAnswers,
  setFormAnswers,
  formSubmitted,
  textColor,
  placeholderColor,
  borderColor,
  primaryColor,
  isDark,
}: InquiryFormFieldListProps) {
  return (
    <>
      {fields.map((field) => (
        <View key={field.id} style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: textColor }]}>
            {field.fieldLabel} {field.isRequired && <Text style={{ color: '#a4243b' }}>*</Text>}
          </Text>

          {field.fieldType === 'boolean' ? (
            <View style={styles.switchRow}>
              <Switch
                value={Boolean(formAnswers[field.id])}
                onValueChange={(val) => setFormAnswers((prev) => ({ ...prev, [field.id]: val }))}
                trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: primaryColor }}
                thumbColor="#ffffff"
                disabled={formSubmitted}
              />
              <Text style={[styles.switchText, { color: textColor }]}>
                {formAnswers[field.id] ? 'Yes' : 'No'}
              </Text>
            </View>
          ) : (
            <TextInput
              value={formAnswers[field.id] !== undefined ? String(formAnswers[field.id]) : ''}
              onChangeText={(val) => setFormAnswers((prev) => ({ ...prev, [field.id]: val }))}
              placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
              placeholderTextColor={placeholderColor}
              keyboardType={field.fieldType === 'number' ? 'numeric' : 'default'}
              editable={!formSubmitted}
              style={[
                styles.fieldInput,
                {
                  borderColor,
                  backgroundColor: isDark ? '#1c1c1e' : '#fcf8f9',
                  color: textColor,
                },
              ]}
            />
          )}
        </View>
      ))}
    </>
  );
}
