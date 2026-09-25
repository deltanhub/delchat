import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../../lib/haptics';
import { styles } from './styles';
import { IncomingCallActionsProps } from './types';

export const IncomingCallActions: React.FC<IncomingCallActionsProps> = ({
  onAccept,
  onDecline,
}) => {
  return (
    <View style={styles.incomingActionsRow}>
      <View style={styles.actionCol}>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDecline?.();
          }}
          style={[styles.circleBtn, styles.declineBtn]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="call"
            size={32}
            color="#ffffff"
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
        <Text style={styles.actionBtnLabel}>Decline</Text>
      </View>

      <View style={styles.actionCol}>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAccept?.();
          }}
          style={[styles.circleBtn, styles.acceptBtn]}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={32} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.actionBtnLabel}>Accept</Text>
      </View>
    </View>
  );
};
