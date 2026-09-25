import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './styles';

interface AddManualLeadContactFieldsProps {
  name: string;
  onChangeName: (val: string) => void;
  phone: string;
  onChangePhone: (val: string) => void;
  email: string;
  onChangeEmail: (val: string) => void;
  isDark: boolean;
  colors: { text: string; placeholder: string; border: string };
}

export function AddManualLeadContactFields({
  name,
  onChangeName,
  phone,
  onChangePhone,
  email,
  onChangeEmail,
  isDark,
  colors,
}: AddManualLeadContactFieldsProps) {
  const inputBg = isDark ? '#262626' : '#f8fafc';

  return (
    <View>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Name *</Text>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        placeholder="e.g. David Adeleke"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.modalInput,
          {
            backgroundColor: inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Phone</Text>
      <TextInput
        value={phone}
        onChangeText={onChangePhone}
        placeholder="e.g. +234 801 234 5678"
        keyboardType="phone-pad"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.modalInput,
          {
            backgroundColor: inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Email</Text>
      <TextInput
        value={email}
        onChangeText={onChangeEmail}
        placeholder="e.g. client@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.modalInput,
          {
            backgroundColor: inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />
    </View>
  );
}
