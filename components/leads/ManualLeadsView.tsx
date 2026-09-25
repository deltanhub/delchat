import React from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  ManualLeadMetricGrid,
  ManualLeadActionBar,
  ManualLeadFilterPills,
  ManualLeadCard,
  ManualLeadsEmptyState,
  useManualLeadsFilter,
} from './manual_leads';
import type { ManualLeadsViewProps } from './manual_leads/types';

export type { ManualLeadsViewProps };

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

  const {
    manualFilterStatus,
    setManualFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredManualLeads,
  } = useManualLeadsFilter(manualLeads);

  return (
    <View style={{ flex: 1 }}>
      {/* Top Metric Tiles matching DeltanHub workspace.tsx */}
      <ManualLeadMetricGrid
        manualCounts={manualCounts}
        colors={colors}
      />

      {/* Action Bar: Add Lead + Search */}
      <ManualLeadActionBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddLead={onOpenAddLead}
        colors={colors}
        isDark={isDark}
      />

      {/* Manual Status Filter Pills */}
      <ManualLeadFilterPills
        manualFilterStatus={manualFilterStatus}
        onSelectStatus={setManualFilterStatus}
        manualLeads={manualLeads}
        colors={colors}
      />

      {/* Manual Leads List */}
      {loading && manualLeads.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredManualLeads.length === 0 ? (
        <ManualLeadsEmptyState colors={colors} />
      ) : (
        <FlatList
          data={filteredManualLeads}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 88 }}
          renderItem={({ item }) => (
            <ManualLeadCard
              lead={item}
              onSelectLead={onSelectLead}
              colors={colors}
              isDark={isDark}
            />
          )}
        />
      )}
    </View>
  );
}
