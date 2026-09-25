import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { LeadDetailContactActionsProps } from './types';

export const LeadDetailContactActions: React.FC<LeadDetailContactActionsProps> = ({
  contactPhone,
  contactEmail,
}) => {
  if (!contactPhone && !contactEmail) return null;

  return (
    <View style={styles.quickActionsRow}>
      {contactPhone && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(`tel:${contactPhone}`);
          }}
          style={[styles.quickActionBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
        >
          <Ionicons name="call" size={16} color="#059669" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>Call</Text>
        </TouchableOpacity>
      )}

      {contactEmail && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(`mailto:${contactEmail}`);
          }}
          style={[styles.quickActionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
        >
          <Ionicons name="mail" size={16} color="#2563eb" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb' }}>Email</Text>
        </TouchableOpacity>
      )}

      {contactPhone && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const clean = contactPhone.replace(/[^0-9]/g, '');
            Linking.openURL(`https://wa.me/${clean}`);
          }}
          style={[styles.quickActionBtn, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#16a34a" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a' }}>WhatsApp</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
