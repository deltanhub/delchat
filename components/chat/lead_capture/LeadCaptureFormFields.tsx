import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { LeadCaptureFormFieldsProps } from './types';

export const LeadCaptureFormFields: React.FC<LeadCaptureFormFieldsProps> = ({
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  note,
  setNote,
  errorMessage,
  setErrorMessage,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const inputBg = isDark ? '#1a1a22' : '#f4f6f8';
  const inputBorder = isDark ? '#2e2e3a' : '#e2e8f0';

  return (
    <>
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
          <Ionicons
            name="alert-circle"
            size={16}
            color="#e11d48"
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.errorText,
              { color: isDark ? '#fda4af' : '#be123c' },
            ]}
          >
            {errorMessage}
          </Text>
        </View>
      ) : null}

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
    </>
  );
};
