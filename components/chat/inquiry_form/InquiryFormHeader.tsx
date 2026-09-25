import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { InquiryFormHeaderProps } from './types';

export const InquiryFormHeader: React.FC<InquiryFormHeaderProps> = ({
  onClose,
  textColor,
  placeholderColor,
  isDark,
}) => {
  return (
    <>
      <View style={[styles.dragHandle, { backgroundColor: isDark ? '#383848' : '#cbd5e1' }]} />
      <View style={[styles.header, { borderBottomColor: isDark ? '#262626' : '#e5e7eb' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Send Inquiry Form</Text>
          <Text style={[styles.headerSubtitle, { color: placeholderColor }]}>
            Select an interactive questionnaire for this client to complete
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={textColor} />
        </TouchableOpacity>
      </View>
    </>
  );
};
