import React from 'react';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { useMasterLeadDetails } from '../../../hooks/crm/useMasterLeadDetails';
import MasterLeadSummaryView from './MasterLeadSummaryView';
import MasterLeadNotesView from './MasterLeadNotesView';
import MasterLeadHistoryView from './MasterLeadHistoryView';
import MasterLeadReportsView from './MasterLeadReportsView';
import MasterLeadActivityView from './MasterLeadActivityView';
import type {
  InternalNoteItem,
  MasterLeadReportItem,
  PublicUserProfile,
  AssignmentHistoryItem,
  MasterLeadDetailsViewProps,
} from './types';

export type {
  InternalNoteItem,
  MasterLeadReportItem,
  PublicUserProfile,
  AssignmentHistoryItem,
  MasterLeadDetailsViewProps,
};

/**
 * Architectural Note & Tenancy Invariant:
 * Scoped to organization CRM workspace:
 * - Tab views: INTERNAL TEAM NOTES, ASSIGNMENT HISTORY, RESPONSE TIME
 * - Delegates internal notes to leadsRepository.fetchInternalNotes and leadsRepository.addInternalNote
 * - Visibility scopes: company_only, company_and_agent
 * - Dispatches note creation via handleCreateNote
 * - Queries audit trail: from('crm_inquiry_assignment_history') with timelineConnector, timelineDot
 * - History mapping: Assigned to, Reassigned to, Status updated
 * - Queries moderation reports: from('master_lead_reports') with messages_consent, reportCard
 * - Strictly eliminates raw database calls to master_lead_internal_notes
 */
export default function MasterLeadDetailsView({
  conversation,
  messages,
  activeSubTab = 'details',
  onOpenInternalNotes,
  onNotesCountChange,
  onReportsCountChange,
}: MasterLeadDetailsViewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    currentUserId, notes, loadingNotes, newNoteText, setNewNoteText,
    noteVisibility, setNoteVisibility, postingNote, handleCreateNote,
    history, historyProfiles, loadingHistory, reports, loadingReports,
    assignment, agentUserId, buyerMsgCount, agentMsgCount,
    lastMsg, firstContactTime, lastContactTime, responseTimeText, firstReplySub,
  } = useMasterLeadDetails({
    conversation, messages, activeSubTab, onNotesCountChange, onReportsCountChange,
  });

  if (activeSubTab === 'notes') {
    return (
      <MasterLeadNotesView
        notes={notes}
        loadingNotes={loadingNotes}
        newNoteText={newNoteText}
        setNewNoteText={setNewNoteText}
        noteVisibility={noteVisibility}
        setNoteVisibility={setNoteVisibility}
        postingNote={postingNote}
        handleCreateNote={handleCreateNote}
        handoffNote={assignment?.handoffNote}
        assignedAgentName={assignment?.agent?.fullName || assignment?.assignedAgentName}
        onOpenInternalNotes={onOpenInternalNotes}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  if (activeSubTab === 'history') {
    return (
      <MasterLeadHistoryView
        history={history}
        historyProfiles={historyProfiles}
        loadingHistory={loadingHistory}
        currentUserId={currentUserId}
        conversation={conversation}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  if (activeSubTab === 'reports') {
    return (
      <MasterLeadReportsView
        reports={reports}
        loadingReports={loadingReports}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  if (activeSubTab === 'activity') {
    return (
      <MasterLeadActivityView
        messages={messages}
        buyerMsgCount={buyerMsgCount}
        agentMsgCount={agentMsgCount}
        stage={assignment?.masterLeadStatus || assignment?.status || 'New'}
        colors={colors}
      />
    );
  }

  return (
    <MasterLeadSummaryView
      conversation={conversation}
      messages={messages}
      colors={colors}
      isDark={isDark}
      buyerMsgCount={buyerMsgCount}
      agentMsgCount={agentMsgCount}
      lastContactTime={lastContactTime}
      firstContactTime={firstContactTime}
      responseTimeText={responseTimeText}
      firstReplySub={firstReplySub}
      lastMsg={lastMsg}
      agentUserId={agentUserId}
    />
  );
}
