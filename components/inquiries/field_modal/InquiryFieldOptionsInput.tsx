import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './styles';
import { InquiryFieldOptionsInputProps } from './types';

export const InquiryFieldOptionsInput: React.FC<InquiryFieldOptionsInputProps> = ({
  optionsText,
  setOptionsText,
  placeholderColor,
  backgroundColor,
  borderColor,
  textColor,
}) => {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={[styles.inputLabel, { color: placeholderColor }]}>
        DROPDOWN OPTIONS (COMMA SEPARATED)
      </Text>
      <TextInput
        value={optionsText}
        onChangeText={setOptionsText}
        placeholder="e.g. Mortgage, Cash Buyer, Payment Plan"
        placeholderTextColor={placeholderColor}
        style={[
          styles.textInput,
          {
            backgroundColor,
            borderColor,
            color: textColor,
          },
        ]}
      />
    </View>
  );
};
