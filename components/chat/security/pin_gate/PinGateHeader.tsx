import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../../ScalePressable';
import { styles } from './styles';
import { PinGateHeaderProps } from './types';

export function PinGateHeader({
  isSetupRequired,
  setupStep,
  textColor,
  placeholderColor,
  isDark,
  onCancel,
}: PinGateHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      {onCancel && (
        <View style={styles.headerBar}>
          <ScalePressable onPress={onCancel} style={styles.dismissBtn}>
            <Ionicons name="close" size={24} color={textColor} />
          </ScalePressable>
        </View>
      )}

      <View
        style={[
          styles.shieldBox,
          {
            backgroundColor: isDark ? 'rgba(74, 15, 31, 0.35)' : '#f4e7eb',
            borderColor: isDark ? '#4a0f1f' : '#e0cad0',
          },
        ]}
      >
        <Ionicons name="lock-closed" size={28} color="#4a0f1f" />
      </View>

      <Text style={[styles.title, { color: textColor }]}>
        {isSetupRequired
          ? setupStep === 'create'
            ? 'Create your PIN for chats'
            : 'Confirm your chat PIN'
          : 'Enter your PIN to restore your chats'}
      </Text>

      <Text style={[styles.subtitle, { color: placeholderColor }]}>
        {isSetupRequired
          ? setupStep === 'create'
            ? 'Create this PIN the first time you open chats. It protects conversations separately from your main account login.'
            : 'Re-enter your PIN to confirm and secure your account.'
          : 'Enter your DeltanHub chat PIN to decrypt and restore your conversations.'}
      </Text>
    </View>
  );
}
