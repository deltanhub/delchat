import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './summaryStyles';

export interface MasterLeadSummaryMetricsProps {
  messagesCount: number;
  buyerMsgCount: number;
  agentMsgCount: number;
  lastContactTime: string;
  isLastMsgByAgent: boolean;
  firstContactTime: string;
  latestIntent?: string | null;
  responseTimeText: string;
  firstReplySub: string;
  colors: any;
}

export default function MasterLeadSummaryMetrics({
  messagesCount,
  buyerMsgCount,
  agentMsgCount,
  lastContactTime,
  isLastMsgByAgent,
  firstContactTime,
  latestIntent,
  responseTimeText,
  firstReplySub,
  colors,
}: MasterLeadSummaryMetricsProps) {
  return (
    <View style={styles.metricsGrid}>
      <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>MESSAGES</Text>
        <Text style={[styles.metricBigValue, { color: colors.text }]}>{messagesCount}</Text>
        <Text style={[styles.metricSub, { color: colors.placeholder }]}>
          Buyer {buyerMsgCount} · Agent {agentMsgCount}
        </Text>
      </View>

      <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>LAST MESSAGE</Text>
        <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
          {lastContactTime}
        </Text>
        <Text style={[styles.metricSub, { color: colors.placeholder }]}>
          {isLastMsgByAgent ? 'By assigned agent' : 'By buyer'}
        </Text>
      </View>

      <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>FIRST CONTACT</Text>
        <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
          {firstContactTime}
        </Text>
        <Text style={[styles.metricSub, { color: colors.placeholder }]}>
          Intent: {(latestIntent || 'Tour request').toUpperCase()}
        </Text>
      </View>

      <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>RESPONSE TIME</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>{responseTimeText}</Text>
        <Text style={[styles.metricSub, { color: colors.placeholder }]}>{firstReplySub}</Text>
      </View>
    </View>
  );
}
