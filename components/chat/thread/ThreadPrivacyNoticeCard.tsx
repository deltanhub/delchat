import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';

export interface ThreadPrivacyNoticeCardProps {
  assignedAgentName?: string;
  isDark: boolean;
  textColor: string;
  placeholderColor: string;
  primaryColor: string;
  onGoToDetails: () => void;
}

export function ThreadPrivacyNoticeCard({
  assignedAgentName = 'the agent',
  isDark,
  textColor,
  placeholderColor,
  primaryColor,
  onGoToDetails,
}: ThreadPrivacyNoticeCardProps) {
  return (
    <View style={styles.privacyNoticeContainer}>
      <View
        style={[
          styles.privacyNoticeCard,
          {
            backgroundColor: isDark ? '#261219' : '#fdf6f8',
            borderColor: isDark ? '#4a0f1f' : '#efe3e8',
          },
        ]}
      >
        <Ionicons
          name="shield-checkmark"
          size={28}
          color={isDark ? '#f4a5b8' : '#4a0f1f'}
          style={{ marginBottom: 8 }}
        />
        <Text style={[styles.privacyNoticeTitle, { color: textColor }]}>
          📍 This listing was assigned to agent {assignedAgentName} from creation.
        </Text>
        <Text style={[styles.privacyNoticeSubtitle, { color: placeholderColor }]}>
          Messages exchanged between the buyer and the agent are private by default.
        </Text>
        <TouchableOpacity
          onPress={onGoToDetails}
          style={[styles.privacyNoticeBtn, { backgroundColor: primaryColor }]}
        >
          <Text style={styles.privacyNoticeBtnText}>Go to Lead Details →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  privacyNoticeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  privacyNoticeCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  privacyNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  privacyNoticeSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  privacyNoticeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  privacyNoticeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
});
