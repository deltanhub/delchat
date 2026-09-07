import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import type {
  ChatInquiryTemplateField,
  InquiryTemplateFieldType,
} from '../../types/inquiries';
import { FIELD_TYPE_LABELS } from '../../types/inquiries';

interface InquiryFieldModalProps {
  visible: boolean;
  initialField: ChatInquiryTemplateField | null;
  onClose: () => void;
  onSave: (fieldData: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>) => void;
}

const FIELD_TYPES: InquiryTemplateFieldType[] = [
  'text',
  'number',
  'date',
  'select',
  'boolean',
  'schedule_call',
];

export const InquiryFieldModal: React.FC<InquiryFieldModalProps> = ({
  visible,
  initialField,
  onClose,
  onSave,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<InquiryTemplateFieldType>('text');
  const [optionsText, setOptionsText] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    if (initialField) {
      setFieldLabel(initialField.fieldLabel);
      setFieldType(initialField.fieldType);
      setOptionsText(initialField.options ? initialField.options.join(', ') : '');
      setIsRequired(initialField.isRequired);
    } else {
      setFieldLabel('');
      setFieldType('text');
      setOptionsText('');
      setIsRequired(false);
    }
  }, [initialField, visible]);

  const handleSave = () => {
    if (!fieldLabel.trim()) return;

    const fieldName = fieldLabel
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 50);

    const options =
      fieldType === 'select'
        ? optionsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    onSave({
      fieldLabel: fieldLabel.trim(),
      fieldName: fieldName || 'custom_field',
      fieldType,
      options,
      isRequired,
      sortOrder: initialField?.sortOrder ?? 0,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? '#27272a' : colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {initialField ? 'Edit Form Field' : 'Add Questionnaire Field'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} keyboardShouldPersistTaps="handled">
            {/* Field Label Input */}
            <Text style={[styles.inputLabel, { color: colors.placeholder }]}>FIELD LABEL</Text>
            <TextInput
              value={fieldLabel}
              onChangeText={setFieldLabel}
              placeholder="e.g. Preferred Move-in Date"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            {/* Field Type Selector */}
            <Text style={[styles.inputLabel, { color: colors.placeholder, marginTop: 16 }]}>
              FIELD TYPE
            </Text>
            <View style={styles.typeGrid}>
              {FIELD_TYPES.map((t) => {
                const isSelected = fieldType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setFieldType(t)}
                    style={[
                      styles.typeChip,
                      isSelected
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: isSelected ? '#ffffff' : colors.text },
                      ]}
                    >
                      {FIELD_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Options Input for Select Type */}
            {fieldType === 'select' && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.inputLabel, { color: colors.placeholder }]}>
                  DROPDOWN OPTIONS (COMMA SEPARATED)
                </Text>
                <TextInput
                  value={optionsText}
                  onChangeText={setOptionsText}
                  placeholder="e.g. Mortgage, Cash Buyer, Payment Plan"
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
            )}

            {/* Required Toggle */}
            <View style={[styles.switchRow, { borderColor: colors.border, marginTop: 20 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Mandatory Field</Text>
                <Text style={[styles.switchSub, { color: colors.placeholder }]}>
                  Buyer must answer this question before submitting
                </Text>
              </View>
              <Switch
                value={isRequired}
                onValueChange={setIsRequired}
                trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: colors.primary }}
              />
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <ScalePressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.saveBtnText}>Save Field</Text>
            </ScalePressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
