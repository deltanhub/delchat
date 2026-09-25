import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { LeadDetailHeaderProps } from './types';

export const LeadDetailHeader: React.FC<LeadDetailHeaderProps> = ({
  onClose,
  textColor,
}) => {
  return (
    <View style={styles.modalHeader}>
      <Text style={[styles.modalHeaderTitle, { color: textColor }]}>Lead Details</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={22} color={textColor} />
      </TouchableOpacity>
    </View>
  );
};
