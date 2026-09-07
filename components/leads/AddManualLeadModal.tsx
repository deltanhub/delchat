import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';
import { ManualLeadItem, PROPERTY_TYPES, PROPERTY_STATUSES } from './types';

interface AddManualLeadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (leadData: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    source: string;
    status: ManualLeadItem['status'];
    propertyType: string;
    propertyStatus: string;
    priceFrom: string;
    priceTo: string;
    bedrooms: string;
    bathrooms: string;
    message: string;
  }) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function AddManualLeadModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}: AddManualLeadModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Add New Lead</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Name *</Text>
            <TextInput
              value={formContactName}
              onChangeText={setFormContactName}
              placeholder="e.g. David Adeleke"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? '#262626' : '#f8fafc',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Phone</Text>
            <TextInput
              value={formContactPhone}
              onChangeText={setFormContactPhone}
              placeholder="e.g. +234 801 234 5678"
              keyboardType="phone-pad"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? '#262626' : '#f8fafc',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Email</Text>
            <TextInput
              value={formContactEmail}
              onChangeText={setFormContactEmail}
              placeholder="e.g. client@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.placeholder}
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? '#262626' : '#f8fafc',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {PROPERTY_TYPES.map((pt) => (
                <TouchableOpacity
                  key={pt}
                  onPress={() => setFormPropertyType(pt)}
                  style={[
                    styles.choicePill,
                    formPropertyType === pt
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: formPropertyType === pt ? '#ffffff' : colors.text,
                    }}
                  >
                    {pt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Listing Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {PROPERTY_STATUSES.map((ps) => (
                <TouchableOpacity
                  key={ps}
                  onPress={() => setFormPropertyStatus(ps)}
                  style={[
                    styles.choicePill,
                    formPropertyStatus === ps
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: formPropertyStatus === ps ? '#ffffff' : colors.text,
                    }}
                  >
                    {ps}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Price From (₦)</Text>
                <TextInput
                  value={formPriceFrom}
                  onChangeText={setFormPriceFrom}
                  placeholder="e.g. 25000000"
                  keyboardType="numeric"
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: isDark ? '#262626' : '#f8fafc',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Price To (₦)</Text>
                <TextInput
                  value={formPriceTo}
                  onChangeText={setFormPriceTo}
                  placeholder="e.g. 50000000"
                  keyboardType="numeric"
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: isDark ? '#262626' : '#f8fafc',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Requirements / Notes</Text>
            <TextInput
              value={formMessage}
              onChangeText={setFormMessage}
              placeholder="Client looking for 3-bedroom in Lekki with BQ..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              style={[
                styles.modalInput,
                {
                  height: 80,
                  backgroundColor: isDark ? '#262626' : '#f8fafc',
                  borderColor: colors.border,
                  color: colors.text,
                  textAlignVertical: 'top',
                },
              ]}
            />

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={handleSave}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Lead</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    marginBottom: 14,
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
});
