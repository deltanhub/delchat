import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { leadsRepository } from '../../lib/repositories/leadsRepository';
import type { ChatConversation } from '../../components/chat/ConversationRow';
import type { ChatMessage } from '../../components/chat/MessageBubble';
import type { MasterLeadSubTab } from '../../components/chat/crm/MasterLeadSubHeader';
import { useLeadNotesState, useLeadHistoryReports, useLeadTimelineAudit } from './lead_details';

export interface UseMasterLeadDetailsParams {
  conversation: ChatConversation;
  messages: ChatMessage[];
  activeSubTab?: MasterLeadSubTab;
  onNotesCountChange?: (count: number) => void;
  onReportsCountChange?: (count: number) => void;
}

export function useMasterLeadDetails({
  conversation,
  messages,
  activeSubTab = 'details',
  onNotesCountChange,
  onReportsCountChange,
}: UseMasterLeadDetailsParams) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const assignment = conversation.assignment;
  const inquiryId = assignment?.inquiryId || assignment?.leadId;
  const agentUserId = assignment?.agent?.userId || assignment?.assignedAgentUserId;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Internal notes delegation to leadsRepository.fetchInternalNotes & leadsRepository.addInternalNote
  const {
    notes,
    loadingNotes,
    newNoteText,
    setNewNoteText,
    noteVisibility,
    setNoteVisibility,
    postingNote,
    loadNotes,
    handleCreateNote,
  } = useLeadNotesState({
    inquiryId,
    conversationId: conversation?.id,
    currentUserId,
    onNotesCountChange,
  });

  const {
    history,
    historyProfiles,
    loadingHistory,
    reports,
    loadingReports,
    loadHistory,
    loadReports,
  } = useLeadHistoryReports({
    inquiryId,
    onReportsCountChange,
  });

  const {
    buyerMsgCount,
    agentMsgCount,
    firstMsg,
    lastMsg,
    firstContactTime,
    lastContactTime,
    responseTimeText,
    firstReplySub,
  } = useLeadTimelineAudit({
    messages,
    agentUserId,
  });

  useEffect(() => {
    if (activeSubTab === 'history') void loadHistory();
  }, [activeSubTab, loadHistory]);

  useEffect(() => {
    if (activeSubTab === 'reports') void loadReports();
  }, [activeSubTab, loadReports]);

  useEffect(() => {
    if (activeSubTab === 'notes') void loadNotes();
  }, [activeSubTab, loadNotes]);

  return {
    currentUserId,
    notes,
    loadingNotes,
    newNoteText,
    setNewNoteText,
    noteVisibility,
    setNoteVisibility,
    postingNote,
    handleCreateNote,
    history,
    historyProfiles,
    loadingHistory,
    reports,
    loadingReports,
    assignment,
    inquiryId,
    agentUserId,
    buyerMsgCount,
    agentMsgCount,
    lastMsg,
    firstContactTime,
    lastContactTime,
    responseTimeText,
    firstReplySub,
  };
}
