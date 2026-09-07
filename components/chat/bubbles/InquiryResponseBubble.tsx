import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage } from './types';

interface InquiryResponseBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export default function InquiryResponseBubble({
  message,
  isCurrentUser,
}: InquiryResponseBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const resp = message.inquiryResponseCard;
  if (!resp) return null;
  const answers = resp.answers || [];

  return (
    <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
      <View style={[styles.inquiryResponseCard, { backgroundColor: colors.card, borderColor: isDark ? '#064e3b' : '#cceadd' }]}>
        <View style={[styles.inquiryResponseHeader, { backgroundColor: isDark ? '#064e3b' : '#e6f6ed', borderBottomColor: isDark ? '#047857' : '#cceadd' }]}>
          <Ionicons name="checkmark-circle" size={16} color={isDark ? '#34d399' : '#1f8e55'} style={{ marginRight: 6 }} />
          <Text style={[styles.inquiryResponseHeaderTitle, { color: isDark ? '#ffffff' : '#1f8e55' }]}>{resp.templateTitle} Submitted</Text>
        </View>
        <View style={styles.inquiryResponseBody}>
          {answers.map((ans, idx) => (
            <View key={idx} style={[styles.responseAnswerRow, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.03)' }]}>
              <Text style={[styles.answerLabel, { color: colors.placeholder }]}>{ans.label}</Text>
              <Text style={[styles.answerValue, { color: colors.text }]}>
                {typeof ans.value === 'boolean' ? (ans.value ? 'Yes' : 'No') : ans.value}
              </Text>
            </View>
          ))}

          {/* Legal Disclaimer */}
          <View style={[styles.disclaimerRow, { borderTopColor: isDark ? '#064e3b' : 'rgba(0,0,0,0.06)' }]}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.placeholder} style={{ marginTop: 1 }} />
            <Text style={[styles.disclaimerText, { color: colors.placeholder }]}>
              Submitted terms are exploratory and subject to contract. Does not constitute a binding conveyance.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  justifyRight: {
    justifyContent: 'flex-end',
  },
  justifyLeft: {
    justifyContent: 'flex-start',
  },
  inquiryResponseCard: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inquiryResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f6ed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cceadd',
  },
  inquiryResponseHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f8e55',
  },
  inquiryResponseBody: {
    padding: 16,
    gap: 10,
  },
  responseAnswerRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    paddingBottom: 6,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  answerValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily,
  },
});
