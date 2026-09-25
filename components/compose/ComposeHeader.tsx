import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';
import { ComposeHeaderProps } from './types';

export default function ComposeHeader({
  step,
  colors,
  topInset,
  onBack,
}: ComposeHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 10, borderBottomColor: colors.border }]}>
      <ScalePressable
        onPress={onBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={step === 'info' ? 'Back to members' : 'Close compose'}
      >
        <Ionicons name={step === 'info' ? 'arrow-back' : 'chevron-down'} size={24} color={colors.primary} />
      </ScalePressable>

      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {step === 'members' ? 'New Message' : 'Group Details'}
      </Text>

      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
});
