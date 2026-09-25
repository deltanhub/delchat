import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';

interface ComposeFooterProps {
  selectedCount: number;
  bottomInset: number;
  colors: any;
  onNext: () => void;
}

export default function ComposeFooter({
  selectedCount,
  bottomInset,
  colors,
  onNext,
}: ComposeFooterProps) {
  if (selectedCount === 0) return null;

  return (
    <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomInset + 12 }]}>
      <ScalePressable
        onPress={onNext}
        style={[styles.nextButton, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={`Next: ${selectedCount} selected`}
      >
        <Text style={styles.nextButtonText}>Next ({selectedCount})</Text>
        <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  nextButton: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
