import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export const BroadcastHeader: React.FC = () => {
  return (
    <View style={styles.headerTagRow}>
      <Text style={styles.brandTitle}>
        DELTANHUB
      </Text>
      <View style={styles.verifiedCheck}>
        <Ionicons name="checkmark" size={9} color="#ffffff" />
      </View>
      <View style={styles.announcementBadge}>
        <Text style={styles.announcementBadgeText}>
          OFFICIAL ANNOUNCEMENT
        </Text>
      </View>
    </View>
  );
};
