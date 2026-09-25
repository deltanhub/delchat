import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  InquiryFieldModalProps,
  styles,
  useInquiryFieldForm,
  InquiryFieldModalHeader,
  InquiryFieldTypeSelector,
  InquiryFieldOptionsInput,
  InquiryFieldRequiredSwitch,
  InquiryFieldModalFooter,
} from './field_modal';

export { InquiryFieldModalProps } from './field_modal';

export const InquiryFieldModal: React.FC<InquiryFieldModalProps> = ({
  visible,
  initialField,
  onClose,
  onSave,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    fieldLabel,
    setFieldLabel,
    fieldType,
    setFieldType,
    optionsText,
    setOptionsText,
    isRequired,
    setIsRequired,
    handleSave,
  } = useInquiryFieldForm({ initialField, visible, onSave, onClose });

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
          <InquiryFieldModalHeader
            isEditing={Boolean(initialField)}
            textColor={colors.text}
            borderColor={colors.border}
            onClose={onClose}
          />

          <ScrollView style={styles.scrollBody} keyboardShouldPersistTaps="handled">
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

            <InquiryFieldTypeSelector
              fieldType={fieldType}
              setFieldType={setFieldType}
              primaryColor={colors.primary}
              backgroundColor={colors.background}
              borderColor={colors.border}
              textColor={colors.text}
            />

            {fieldType === 'select' && (
              <InquiryFieldOptionsInput
                optionsText={optionsText}
                setOptionsText={setOptionsText}
                placeholderColor={colors.placeholder}
                backgroundColor={colors.background}
                borderColor={colors.border}
                textColor={colors.text}
              />
            )}

            <InquiryFieldRequiredSwitch
              isRequired={isRequired}
              setIsRequired={setIsRequired}
              textColor={colors.text}
              placeholderColor={colors.placeholder}
              borderColor={colors.border}
              primaryColor={colors.primary}
              isDark={isDark}
            />
          </ScrollView>

          <InquiryFieldModalFooter
            onClose={onClose}
            onSave={handleSave}
            borderColor={colors.border}
            textColor={colors.text}
            primaryColor={colors.primary}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
