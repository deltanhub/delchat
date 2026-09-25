import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { LeadCaptureActionsProps } from './types';

export const LeadCaptureActions: React.FC<LeadCaptureActionsProps> = ({
  isSubmitting,
  isDark,
  onClose,
  onSubmit,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.actionsRow}>
      <ScalePressable
        onPress={onClose}
        style={[
          styles.secondaryButton,
          {
            backgroundColor: isDark ? '#1e1e28' : '#f1f5f9',
            borderColor: isDark ? '#2e2e3e' : '#e2e8f0',
          },
        ]}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
          Cancel
        </Text>
      </ScalePressable>

      <ScalePressable
        onPress={onSubmit}
        style={[
          styles.primaryButton,
          { backgroundColor: colors.primary },
          isSubmitting && { opacity: 0.7 },
        ]}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Create lead"
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons
              name="person-add"
              size={16}
              color="#ffffff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.primaryButtonText}>Create lead</Text>
          </>
        )}
      </ScalePressable>
    </View>
  );
};
