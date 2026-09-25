import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { LeadCaptureHeaderProps } from './types';

export const LeadCaptureHeader: React.FC<LeadCaptureHeaderProps> = ({
  isDark,
  onClose,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <>
      <View style={styles.dragHandleContainer}>
        <View
          style={[
            styles.dragHandle,
            { backgroundColor: isDark ? '#383848' : '#cbd5e1' },
          ]}
        />
      </View>

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create lead
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
            Capture a new contact directly from this conversation.
          </Text>
        </View>
        <ScalePressable
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: isDark ? '#22222c' : '#f1f5f9' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </ScalePressable>
      </View>
    </>
  );
};
