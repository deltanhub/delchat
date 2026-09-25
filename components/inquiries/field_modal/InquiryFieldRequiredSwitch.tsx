import React from 'react';
import { View, Text, Switch } from 'react-native';
import { styles } from './styles';
import { InquiryFieldRequiredSwitchProps } from './types';

export const InquiryFieldRequiredSwitch: React.FC<InquiryFieldRequiredSwitchProps> = ({
  isRequired,
  setIsRequired,
  textColor,
  placeholderColor,
  borderColor,
  primaryColor,
  isDark,
}) => {
  return (
    <View style={[styles.switchRow, { borderColor, marginTop: 20 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.switchLabel, { color: textColor }]}>Mandatory Field</Text>
        <Text style={[styles.switchSub, { color: placeholderColor }]}>
          Buyer must answer this question before submitting
        </Text>
      </View>
      <Switch
        value={isRequired}
        onValueChange={setIsRequired}
        trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: primaryColor }}
      />
    </View>
  );
};
