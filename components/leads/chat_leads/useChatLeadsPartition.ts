import { useState, useMemo } from 'react';
import { ChatLeadItem } from '../types';
import { ChatSubTab } from './types';

interface UseChatLeadsPartitionParams {
  chatLeads: ChatLeadItem[];
  currentUser: { id: string } | null;
  isAgencyOrDev: boolean;
}

export function useChatLeadsPartition({
  chatLeads,
  currentUser,
  isAgencyOrDev,
}: UseChatLeadsPartitionParams) {
  const [chatSubTab, setChatSubTab] = useState<ChatSubTab>('master');
  const [chatFilterStatus, setChatFilterStatus] = useState<string>('all');

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

  const partitionedChatLeads = useMemo(() => {
    if (!isAgencyOrDev) return chatLeads;
    if (chatSubTab === 'master') {
      return chatLeads.filter(
        (l) => Boolean(l.assignedToUserId) && l.assignedToUserId !== currentUser?.id
      );
    } else {
      return chatLeads.filter(
        (l) => !l.assignedToUserId || l.assignedToUserId === currentUser?.id
      );
    }
  }, [chatLeads, chatSubTab, isAgencyOrDev, currentUser?.id]);

  const filteredChatLeads = useMemo(() => {
    if (chatFilterStatus === 'all') return partitionedChatLeads;
    return partitionedChatLeads.filter((l) => l.status === chatFilterStatus);
  }, [partitionedChatLeads, chatFilterStatus]);

  return {
    chatSubTab,
    setChatSubTab,
    chatFilterStatus,
    setChatFilterStatus,
    masterLeadsCount,
    myLeadsCount,
    partitionedChatLeads,
    filteredChatLeads,
  };
}
