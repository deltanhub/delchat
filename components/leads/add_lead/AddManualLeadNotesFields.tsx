import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './styles';

interface AddManualLeadNotesFieldsProps {
  message: string;
  onChangeMessage: (val: string) => void;
  isDark: boolean;
  colors: { text: string; placeholder: string; border: string };
}

export function AddManualLeadNotesFields({
  message,
  onChangeMessage,
  isDark,
  colors,
}: AddManualLeadNotesFieldsProps) {
  const inputBg = isDark ? '#262626' : '#f8fafc';

  return (
    <View>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Requirements / Notes</Text>
      <TextInput
        value={message}
        onChangeText={onChangeMessage}
        placeholder="Client looking for 3-bedroom in Lekki with BQ..."
        placeholderTextColor={colors.placeholder}
        multiline
        numberOfLines={3}
        style={[
          styles.modalInput,
          {
            height: 80,
            backgroundColor: inputBg,
            borderColor: colors.border,
            color: colors.text,
            textAlignVertical: 'top',
          },
        ]}
      />
    </View>
  );
}
