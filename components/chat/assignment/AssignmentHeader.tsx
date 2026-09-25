import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';

export interface AssignmentHeaderProps {
  onClose: () => void;
  colors: any;
  isDark: boolean;
}

export function AssignmentHeader({ onClose, colors, isDark }: AssignmentHeaderProps) {
  return (
    <>
      <View style={styles.handleContainer}>
        <View style={[styles.handleBar, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Lead</Text>
          <Text style={[styles.modalSubtitle, { color: colors.placeholder }]}>
            Delegate lead conversations to specialized agents
          </Text>
        </View>
        <ScalePressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
          <Ionicons name="close" size={20} color={colors.placeholder} />
        </ScalePressable>
      </View>
    </>
  );
}

export default AssignmentHeader;
