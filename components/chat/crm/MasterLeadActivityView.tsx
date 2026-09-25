import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Typography } from '../../../constants/Typography';
import type { ChatMessage } from '../MessageBubble';

export interface MasterLeadActivityViewProps {
  messages: ChatMessage[];
  buyerMsgCount: number;
  agentMsgCount: number;
  stage: string;
  colors: any;
}

export default function MasterLeadActivityView({
  messages,
  buyerMsgCount,
  agentMsgCount,
  stage,
  colors,
}: MasterLeadActivityViewProps) {
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>ACTIVITY TIMELINE</Text>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Total Messages</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>{messages.length}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Buyer Inquiries</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>{buyerMsgCount}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Agent Responses</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>{agentMsgCount}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Current Stage</Text>
          <Text style={[styles.dataValue, { color: colors.primary, fontWeight: '700' }]}>
            {stage.toUpperCase()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  dataLabel: { fontSize: 13, fontFamily: Typography.fontFamily },
  dataValue: { fontSize: 13, fontWeight: '500', fontFamily: Typography.fontFamily },
});
