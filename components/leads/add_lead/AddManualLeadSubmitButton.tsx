import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { styles } from './styles';

interface AddManualLeadSubmitButtonProps {
  isSubmitting: boolean;
  onPress: () => void;
  colors: { primary: string };
}

export function AddManualLeadSubmitButton({
  isSubmitting,
  onPress,
  colors,
}: AddManualLeadSubmitButtonProps) {
  return (
    <TouchableOpacity
      disabled={isSubmitting}
      onPress={onPress}
      style={[styles.submitBtn, { backgroundColor: colors.primary }]}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={styles.submitBtnText}>Save Lead</Text>
      )}
    </TouchableOpacity>
  );
}
