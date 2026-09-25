import React from 'react';
import { Modal, KeyboardAvoidingView, Platform, View, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  styles,
  useAddManualLeadForm,
  AddManualLeadHeader,
  AddManualLeadContactFields,
  AddManualLeadPropertyFields,
  AddManualLeadNotesFields,
  AddManualLeadSubmitButton,
} from './add_lead';
import type { AddManualLeadModalProps, AddManualLeadFormData } from './add_lead';

export type { AddManualLeadModalProps, AddManualLeadFormData };

/**
 * AddManualLeadModal
 * Clean Architecture slim presenter for creating manual CRM leads.
 * Orchestrates modular form sections, validation, and submission state.
 */
export default function AddManualLeadModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}: AddManualLeadModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    formContactName,
    setFormContactName,
    formContactEmail,
    setFormContactEmail,
    formContactPhone,
    setFormContactPhone,
    formPropertyType,
    setFormPropertyType,
    formPropertyStatus,
    setFormPropertyStatus,
    formPriceFrom,
    setFormPriceFrom,
    formPriceTo,
    setFormPriceTo,
    formMessage,
    setFormMessage,
    handleSave,
  } = useAddManualLeadForm(onSubmit, onClose);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <AddManualLeadHeader colors={colors} onClose={onClose} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            <AddManualLeadContactFields
              name={formContactName}
              onChangeName={setFormContactName}
              phone={formContactPhone}
              onChangePhone={setFormContactPhone}
              email={formContactEmail}
              onChangeEmail={setFormContactEmail}
              isDark={isDark}
              colors={colors}
            />

            <AddManualLeadPropertyFields
              propertyType={formPropertyType}
              onChangePropertyType={setFormPropertyType}
              propertyStatus={formPropertyStatus}
              onChangePropertyStatus={setFormPropertyStatus}
              priceFrom={formPriceFrom}
              onChangePriceFrom={setFormPriceFrom}
              priceTo={formPriceTo}
              onChangePriceTo={setFormPriceTo}
              isDark={isDark}
              colors={colors}
            />

            <AddManualLeadNotesFields
              message={formMessage}
              onChangeMessage={setFormMessage}
              isDark={isDark}
              colors={colors}
            />

            <AddManualLeadSubmitButton
              isSubmitting={isSubmitting}
              onPress={handleSave}
              colors={colors}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
