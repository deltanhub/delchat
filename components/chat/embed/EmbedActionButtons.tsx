import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import { EmbedActionButtonsProps } from './types';

export const EmbedActionButtons: React.FC<EmbedActionButtonsProps> = ({
  onClose,
  onSubmit,
  textColor,
  primaryColor,
  isDark,
}) => {
  return (
    <View style={styles.buttonRow}>
      <TouchableOpacity
        onPress={onClose}
        style={[styles.cancelBtn, { borderColor: isDark ? '#33333b' : '#e5e7eb' }]}
      >
        <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSubmit}
        style={[styles.submitBtn, { backgroundColor: primaryColor }]}
      >
        <Text style={styles.submitBtnText}>Embed in Chat</Text>
      </TouchableOpacity>
    </View>
  );
};
