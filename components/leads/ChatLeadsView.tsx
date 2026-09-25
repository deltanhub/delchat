import React, { useMemo } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  ChatLeadsViewProps,
  ChatLeadsSubTabs,
  ChatLeadsPipelineBar,
  ChatLeadsCard,
  ChatLeadsEmptyState,
  useChatLeadsPartition,
  styles,
} from './chat_leads';

/**
 * Master Leads & Assigned Leads Partitioning Architectural Invariants:
 * - Master Leads: `Boolean(l.assignedToUserId) && l.assignedToUserId !== currentUser?.id`
 * - My Leads: `!l.assignedToUserId || l.assignedToUserId === currentUser?.id`
 * - Badge verification: `masterLeadBadge`, `assignedAgentChip`
 */
export default function ChatLeadsView({
  loading,
  refreshing,
  onRefresh,
  chatLeads,
  currentUser,
  isAgencyOrDev,
  savingChatLeadId,
  onUpdateChatLeadStatus,
  onOpenConversation,
}: ChatLeadsViewProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    chatSubTab,
    setChatSubTab,
    chatFilterStatus,
    setChatFilterStatus,
    partitionedChatLeads,
    filteredChatLeads,
  } = useChatLeadsPartition({ chatLeads, currentUser, isAgencyOrDev });

  const masterLeadsCount = useMemo(() => {
    return chatLeads.filter(
      (l) => Boolean(l.assignedToUserId) && l.assignedToUserId !== currentUser?.id
    ).length;
  }, [chatLeads, currentUser?.id]);

  const myLeadsCount = useMemo(() => {
    return chatLeads.filter(
      (l) => !l.assignedToUserId || l.assignedToUserId === currentUser?.id
    ).length;
  }, [chatLeads, currentUser?.id]);

  return (
    <View style={{ flex: 1 }}>
      {isAgencyOrDev && (
        <ChatLeadsSubTabs
          subTab={chatSubTab}
          onSelectSubTab={setChatSubTab}
          masterLeadsCount={masterLeadsCount}
          myLeadsCount={myLeadsCount}
          primaryColor={colors.primary}
          placeholderColor={colors.placeholder}
          borderColor={colors.border}
        />
      )}

      <ChatLeadsPipelineBar
        filterStatus={chatFilterStatus}
        onSelectStatus={setChatFilterStatus}
        partitionedChatLeads={partitionedChatLeads}
        primaryColor={colors.primary}
        textColor={colors.text}
        borderColor={colors.border}
      />

      {loading && chatLeads.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredChatLeads.length === 0 ? (
        <ChatLeadsEmptyState textColor={colors.text} placeholderColor={colors.placeholder} />
      ) : (
        <FlatList
          data={filteredChatLeads}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 88 }}
          renderItem={({ item }) => (
            <ChatLeadsCard
              item={item}
              currentUser={currentUser}
              isDark={isDark}
              colors={colors}
              savingChatLeadId={savingChatLeadId}
              onUpdateChatLeadStatus={onUpdateChatLeadStatus}
              onOpenConversation={onOpenConversation}
            />
          )}
        />
      )}
    </View>
  );
}

export { ChatLeadsCard, ChatLeadsSubTabs, ChatLeadsPipelineBar, ChatLeadsEmptyState };
