import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import type { AddManualLeadFormData, AddManualLeadModalProps } from './types';
import type { ManualLeadItem } from '../types';

export function useAddManualLeadForm(
  onSubmit: AddManualLeadModalProps['onSubmit'],
  onClose: () => void
) {
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formSource] = useState('Dashboard lead');
  const [formStatus] = useState<ManualLeadItem['status']>('new');
  const [formPropertyType, setFormPropertyType] = useState('Apartment');
  const [formPropertyStatus, setFormPropertyStatus] = useState('For Sale');
  const [formPriceFrom, setFormPriceFrom] = useState('');
  const [formPriceTo, setFormPriceTo] = useState('');
  const [formBedrooms] = useState('');
  const [formBathrooms] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const resetForm = () => {
    setFormContactName('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormPriceFrom('');
    setFormPriceTo('');
    setFormMessage('');
  };

  const handleSave = async () => {
    if (!formContactName.trim()) {
      Alert.alert('Required Field', 'Contact name is required.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await onSubmit({
      contactName: formContactName,
      contactEmail: formContactEmail,
      contactPhone: formContactPhone,
      source: formSource,
      status: formStatus,
      propertyType: formPropertyType,
      propertyStatus: formPropertyStatus,
      priceFrom: formPriceFrom,
      priceTo: formPriceTo,
      bedrooms: formBedrooms,
      bathrooms: formBathrooms,
      message: formMessage,
    });

    if (success) {
      resetForm();
      onClose();
    }
  };

  return {
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
    resetForm,
  };
}
