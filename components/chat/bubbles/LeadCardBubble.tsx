import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage, formatMsgTime } from './types';

interface LeadCardBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
}

export default function LeadCardBubble({ message, isCurrentUser, isStarred = false }: LeadCardBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const leadData = message.structuredPayload?.lead || message.structuredPayload || {};
  const leadName = leadData.fullName || leadData.name || 'New Client Lead';
  const leadEmail = leadData.email;
  const leadPhone = leadData.phone;
  const leadBudget = leadData.budget;
  const leadNotes = leadData.notes || message.body;

  return (
    <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
      <View style={[styles.leadCard, { backgroundColor: colors.card, borderColor: isDark ? '#14412e' : '#cceadd' }]}>
        <View style={[styles.leadHeader, { backgroundColor: isDark ? '#082f1f' : '#e6f6ed', borderBottomColor: isDark ? '#14412e' : '#cceadd' }]}>
          <Ionicons name="person-add" size={18} color={isDark ? '#34d399' : '#047857'} style={{ marginRight: 6 }} />
          <Text style={[styles.leadHeaderTitle, { color: isDark ? '#34d399' : '#047857' }]}>LEAD CAPTURED</Text>
        </View>
        <View style={styles.leadBody}>
          <Text style={[styles.leadName, { color: colors.text }]}>{leadName}</Text>
          {leadEmail && <Text style={[styles.leadDetailText, { color: colors.text }]}>✉️  {leadEmail}</Text>}
          {leadPhone && <Text style={[styles.leadDetailText, { color: colors.text }]}>📞  {leadPhone}</Text>}
          {leadBudget && (
            <Text style={[styles.leadDetailText, { color: isDark ? '#4ade80' : '#047857', fontWeight: '600' }]}>
              💰  Budget: {leadBudget}
            </Text>
          )}
          {leadNotes ? <Text style={[styles.leadNotesText, { color: colors.placeholder }]}>{leadNotes}</Text> : null}
          <View style={styles.timeRow}>
            {isStarred && (
              <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.msgTimeText, { color: colors.placeholder }]}>
              {formatMsgTime(message.sentAt)}
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
  leadCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  leadHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Typography.fontFamily,
  },
  leadBody: {
    padding: 16,
    gap: 6,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Typography.fontFamily,
  },
  leadDetailText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  leadNotesText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  msgTimeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
  },
});
