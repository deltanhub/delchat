import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { callModalStyles } from './callModalStyles';

interface CallReconnectingBannerProps {
  topInset: number;
}

export function CallReconnectingBanner({ topInset }: CallReconnectingBannerProps) {
  return (
    <View style={[callModalStyles.reconnectingBanner, { top: topInset + 8 }]}>
      <Ionicons name="swap-horizontal" size={14} color="#ffffff" style={{ marginRight: 6 }} />
      <Text style={callModalStyles.reconnectingText}>Reconnecting · Handover in progress</Text>
    </View>
  );
}
