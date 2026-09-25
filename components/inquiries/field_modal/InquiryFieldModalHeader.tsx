import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { InquiryFieldModalHeaderProps } from './types';

export const InquiryFieldModalHeader: React.FC<InquiryFieldModalHeaderProps> = ({
  isEditing,
  textColor,
  borderColor,
  onClose,
}) => {
  return (
    <View style={[styles.header, { borderBottomColor: borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        {isEditing ? 'Edit Form Field' : 'Add Questionnaire Field'}
      </Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={22} color={textColor} />
      </TouchableOpacity>
    </View>
  );
};
