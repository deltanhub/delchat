import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';

export interface CallHeaderProps {
  partnerName: string;
  partnerRole?: string | null;
  statusText?: string;
  showSecurityBadge?: boolean;
}

export const CallHeader: React.FC<CallHeaderProps> = ({
  partnerName,
  partnerRole,
  statusText,
  showSecurityBadge = true,
}) => {
  return (
    <View style={styles.headerContainer}>
      {showSecurityBadge && (
        <View style={styles.securityBadge}>
          <Ionicons name="lock-closed" size={12} color="#4ade80" style={{ marginRight: 6 }} />
          <Text style={styles.securityBadgeText}>End-to-end encrypted</Text>
        </View>
      )}
      <Text style={styles.partnerNameText} numberOfLines={1}>
        {partnerName}
      </Text>
      {!!partnerRole && (
        <Text style={styles.partnerRoleText} numberOfLines={1}>
          {partnerRole}
        </Text>
      )}
      {!!statusText && (
        <Text style={styles.statusIndicatorText}>
          {statusText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  securityBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    fontFamily: Typography.fontFamily,
  },
  partnerNameText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
  },
  partnerRoleText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
    fontFamily: Typography.fontFamily,
  },
  statusIndicatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a1a1aa',
    fontFamily: Typography.fontFamily,
  },
});
