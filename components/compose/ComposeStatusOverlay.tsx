import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { ComposeMode } from './types';

interface ComposeStatusOverlayProps {
  isSubmitting: boolean;
  mode: ComposeMode;
  error: string | null;
  colors: any;
}

export default function ComposeStatusOverlay({
  isSubmitting,
  mode,
  error,
  colors,
}: ComposeStatusOverlayProps) {
  return (
    <>
      {isSubmitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.submittingText, { color: colors.text }]}>
            {mode === 'direct' ? 'Creating chat thread...' : 'Creating group...'}
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  submittingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submittingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
});
