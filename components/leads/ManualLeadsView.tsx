import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';
import { ManualLeadItem, MANUAL_LEAD_STATUS_OPTIONS } from './types';

interface ManualLeadsViewProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  manualLeads: ManualLeadItem[];
  manualCounts: {
    total: number;
    new: number;
    active: number;
    viewing: number;
    closedOrLost: number;
  };
  onOpenAddLead: () => void;
  onSelectLead: (lead: ManualLeadItem) => void;
}

export default function ManualLeadsView({
  loading,
  refreshing,
  onRefresh,
  manualLeads,
  manualCounts,
  onOpenAddLead,
  onSelectLead,
}: ManualLeadsViewProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [manualFilterStatus, setManualFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredManualLeads = useMemo(() => {
    return manualLeads.filter((lead) => {
      if (manualFilterStatus !== 'all' && lead.status !== manualFilterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.contactName.toLowerCase().includes(q);
        const matchesEmail = lead.contactEmail?.toLowerCase().includes(q) || false;
        const matchesPhone = lead.contactPhone?.toLowerCase().includes(q) || false;
        const matchesType = lead.propertyType?.toLowerCase().includes(q) || false;
        return matchesName || matchesEmail || matchesPhone || matchesType;
      }
      return true;
    });
  }, [manualLeads, manualFilterStatus, searchQuery]);

  return (
    <View style={{ flex: 1 }}>
      {/* Top Metric Tiles matching DeltanHub workspace.tsx */}
      <View style={styles.metricGrid}>
        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.metricIconBox, { backgroundColor: '#eef3ff' }]}>
            <Ionicons name="people" size={16} color="#3b6ff5" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.total}</Text>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Total leads</Text>
        </View>

        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.metricIconBox, { backgroundColor: '#fff4e6' }]}>
            <Ionicons name="pulse" size={16} color="#e07c24" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.active}</Text>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Active follow-up</Text>
        </View>

        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.metricIconBox, { backgroundColor: '#edfaf4' }]}>
            <Ionicons name="calendar" size={16} color="#1ba368" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.viewing}</Text>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Viewing scheduled</Text>
        </View>

        <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.metricIconBox, { backgroundColor: '#fdeef1' }]}>
            <Ionicons name="checkmark-done" size={16} color="#d0364e" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.closedOrLost}</Text>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Closed / Lost</Text>
        </View>
      </View>

      {/* Action Bar: Add Lead + Search */}
      <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: isDark ? '#262626' : '#f8fafc', borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={colors.placeholder} style={{ marginRight: 6 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search leads, phone, properties..."
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onOpenAddLead();
          }}
          style={[styles.addLeadBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.addLeadBtnText}>Add Lead</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Status Filter Pills */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {MANUAL_LEAD_STATUS_OPTIONS.map((st) => {
            const isActive = manualFilterStatus === st.value;
            const count =
              st.value === 'all'
                ? manualLeads.length
                : manualLeads.filter((l) => l.status === st.value).length;
            return (
              <TouchableOpacity
                key={st.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setManualFilterStatus(st.value);
                }}
                style={[styles.filterChip, isActive && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.filterChipText, { color: isActive ? '#ffffff' : colors.text }]}>
                  {st.shortLabel} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Manual Leads List */}
      {loading && manualLeads.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredManualLeads.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="person-add-outline" size={54} color={colors.placeholder} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Manual Leads Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
            Press &quot;+ Add Lead&quot; above to record prospective buyers and coordinate follow-up.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredManualLeads}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 88 }}
          renderItem={({ item }) => {
            const statusMeta =
              MANUAL_LEAD_STATUS_OPTIONS.find((s) => s.value === item.status) || MANUAL_LEAD_STATUS_OPTIONS[1];
            return (
              <ScalePressable
                onPress={() => {
                  onSelectLead(item);
                }}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.contactName}</Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: isDark ? statusMeta.bgDark : statusMeta.bgLight },
                        ]}
                      >
                        <Text style={[styles.statusPillText, { color: statusMeta.color }]}>
                          {statusMeta.shortLabel?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.cardMeta, { color: colors.placeholder }]}>
                      {[item.propertyType, item.propertyStatus].filter(Boolean).join(' · ') || 'General Inquiry'}
                    </Text>

                    {(item.priceFrom || item.priceTo) && (
                      <Text style={[styles.budgetBadgeText, { color: colors.primary }]}>
                        Budget: {item.priceFrom ? `₦${item.priceFrom.toLocaleString()}` : '0'} -{' '}
                        {item.priceTo ? `₦${item.priceTo.toLocaleString()}` : 'Any'}
                      </Text>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                </View>

                <View style={[styles.cardFooterSimple, { borderTopColor: colors.border }]}>
                  <Text style={[styles.timestampText, { color: colors.placeholder }]}>
                    Source: {item.source} · {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </ScalePressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  filterChipText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  metricGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    marginTop: 2,
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    padding: 0,
  },
  addLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
  },
  addLeadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  cardMeta: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  budgetBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  cardFooterSimple: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 8,
    fontFamily: Typography.fontFamily,
  },
});
