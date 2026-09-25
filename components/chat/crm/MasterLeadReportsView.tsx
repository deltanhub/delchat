import React from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';
import type { MasterLeadReportItem } from './types';

export interface MasterLeadReportsViewProps {
  reports: MasterLeadReportItem[];
  loadingReports: boolean;
  colors: any;
  isDark: boolean;
}

export default function MasterLeadReportsView({
  reports,
  loadingReports,
  colors,
  isDark,
}: MasterLeadReportsViewProps) {
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.privacyBox,
          {
            backgroundColor: isDark ? '#261219' : '#fdf6f8',
            borderColor: isDark ? '#4a0f1f' : '#efe3e8',
          },
        ]}
      >
        <View style={styles.privacyHeader}>
          <Ionicons name="shield-checkmark" size={14} color={isDark ? '#f4a5b8' : '#4a0f1f'} />
          <Text style={[styles.privacyTitle, { color: isDark ? '#f4a5b8' : '#4a0f1f' }]}>
            Moderation & Buyer Reports
          </Text>
        </View>
        <Text style={[styles.privacyText, { color: isDark ? '#e5e7eb' : '#5f5360' }]}>
          Buyer-reported issues appear here. When a buyer files a report and grants consent, the company can read that
          thread for the duration needed to resolve the report. All access is audit-logged.
        </Text>
      </View>

      {loadingReports ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : reports.length > 0 ? (
        reports.map((r) => {
          const isPending = r.report_status === 'pending';
          return (
            <View
              key={r.id}
              style={[
                styles.reportCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderLeftColor: isPending ? '#a4243b' : '#10b981',
                },
              ]}
            >
              <View style={styles.reportCardHeader}>
                <Text style={[styles.reportStatusBadge, { color: isPending ? '#a4243b' : '#10b981' }]}>
                  Buyer report · {r.report_status.toUpperCase()}
                </Text>
                <Text style={[styles.reportDateText, { color: colors.placeholder }]}>
                  {new Date(r.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.reportDetails}>
                <Text style={[styles.reportFieldText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' }}>Reason: </Text>
                  {r.reason}
                </Text>
                {r.details ? (
                  <Text style={[styles.reportFieldText, { color: colors.text, marginTop: 4 }]}>
                    <Text style={{ fontWeight: '700' }}>Details: </Text>
                    {r.details}
                  </Text>
                ) : null}
                <Text style={[styles.reportFieldText, { color: colors.text, marginTop: 4 }]}>
                  <Text style={{ fontWeight: '700' }}>Reported by: </Text>
                  {r.reporter_name || 'Buyer'}
                </Text>
                <Text style={[styles.reportFieldText, { color: colors.text, marginTop: 4 }]}>
                  <Text style={{ fontWeight: '700' }}>Consent given: </Text>
                  {r.messages_consent ? '✅ Yes — company may read messages to resolve' : '❌ No'}
                </Text>
                {r.resolution_note ? (
                  <Text
                    style={[
                      styles.reportFieldText,
                      { color: colors.placeholder, marginTop: 6, fontStyle: 'italic' },
                    ]}
                  >
                    Resolution: {r.resolution_note}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })
      ) : (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              alignItems: 'center',
              paddingVertical: 24,
            },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={36} color="#10b981" />
          <Text style={[styles.cardTitle, { color: colors.text, marginTop: 8 }]}>NO ACTIVE REPORTS</Text>
          <Text style={[styles.metricSub, { color: colors.placeholder, textAlign: 'center', maxWidth: 260 }]}>
            This conversation is in good standing with zero moderation flags.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  privacyBox: { padding: 12, borderRadius: 10, borderWidth: 1 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  privacyTitle: { fontSize: 13, fontWeight: '700', fontFamily: Typography.fontFamily },
  privacyText: { fontSize: 12, fontFamily: Typography.fontFamily, lineHeight: 16 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  metricSub: { fontSize: 11, marginTop: 4, fontFamily: Typography.fontFamily },
  reportCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 12, padding: 14, marginBottom: 10 },
  reportCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reportStatusBadge: { fontSize: 11, fontWeight: '700', fontFamily: Typography.fontFamily },
  reportDateText: { fontSize: 11, fontFamily: Typography.fontFamily },
  reportDetails: { marginTop: 2 },
  reportFieldText: { fontSize: 12.5, lineHeight: 18, fontFamily: Typography.fontFamily },
});
