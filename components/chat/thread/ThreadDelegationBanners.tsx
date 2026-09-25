import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Typography } from '../../../constants/Typography';

export interface ThreadDelegationHeaderNoticeProps {
  assignedAgentName?: string;
  assignedAt?: string | null;
  isDark: boolean;
  borderColor: string;
  placeholderColor: string;
  primaryColor: string;
  onGoToDetails: () => void;
}

export function ThreadDelegationHeaderNotice({
  assignedAgentName = 'the agent',
  assignedAt,
  isDark,
  borderColor,
  placeholderColor,
  primaryColor,
  onGoToDetails,
}: ThreadDelegationHeaderNoticeProps) {
  const formattedDate = assignedAt
    ? ` on ${new Date(assignedAt).toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'short',
      })}`
    : '';

  return (
    <View
      style={[
        styles.delegationNoticeCard,
        {
          backgroundColor: isDark ? '#1f1f23' : '#ffffff',
          borderColor,
        },
      ]}
    >
      <Text style={[styles.delegationNoticeText, { color: placeholderColor }]}>
        📍 Lead was delegated to agent {assignedAgentName}
        {formattedDate}
      </Text>
      <TouchableOpacity
        onPress={onGoToDetails}
        style={[styles.delegationNoticeBtn, { backgroundColor: primaryColor }]}
      >
        <Text style={styles.delegationNoticeBtnText}>Go to Lead Details →</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ThreadPreDelegationBanner({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={[
        styles.preDelegationBanner,
        {
          backgroundColor: isDark ? '#261219' : '#fdf6f8',
          borderColor: isDark ? '#4a0f1f' : '#efe3e8',
        },
      ]}
    >
      <Text
        style={[
          styles.preDelegationBannerText,
          { color: isDark ? '#f4a5b8' : '#5f5360' },
        ]}
      >
        💬 Below is the message history prior to agent delegation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  delegationNoticeCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 10,
  },
  delegationNoticeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginBottom: 8,
  },
  delegationNoticeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  delegationNoticeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  preDelegationBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginVertical: 12,
  },
  preDelegationBannerText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
});
