import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../../constants/Typography';
import { TextFraudWarningProps } from './types';

export function TextFraudWarning({ isDark }: TextFraudWarningProps) {
  return (
    <View
      style={[
        styles.fraudWarningBanner,
        {
          backgroundColor: isDark ? '#261215' : '#fff1f2',
          borderColor: isDark ? '#4c1d24' : '#fecdd3',
        },
      ]}
    >
      <Ionicons name="warning" size={14} color="#e11d48" style={{ marginTop: 1 }} />
      <Text style={[styles.fraudWarningText, { color: isDark ? '#fca5a5' : '#be123c' }]}>
        Security Alert: Never transfer funds to private bank accounts in chat. DeltanHub staff will never ask for direct transfers or inspection fees. Always use official verified escrow.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fraudWarningBanner: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '100%',
  },
  fraudWarningText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
});

export default TextFraudWarning;
