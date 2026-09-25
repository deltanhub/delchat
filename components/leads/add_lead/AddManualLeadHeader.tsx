import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface AddManualLeadHeaderProps {
  colors: { text: string };
  onClose: () => void;
}

export function AddManualLeadHeader({ colors, onClose }: AddManualLeadHeaderProps) {
  return (
    <View style={styles.modalHeader}>
      <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Add New Lead</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={22} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}
