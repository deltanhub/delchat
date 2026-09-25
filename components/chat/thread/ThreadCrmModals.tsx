import React from 'react';
import LeadCaptureModal from '../LeadCaptureModal';
import ReportModal from '../ReportModal';
import ManageAssignmentModal from '../ManageAssignmentModal';
import LeadInternalNotesModal from '../LeadInternalNotesModal';
import QuickStatusModal from './QuickStatusModal';

export interface ThreadCrmModalsProps {
  modals: any;
  session: any;
  messages: any;
  conversationId: string;
  colors: any;
  isDark: boolean;
}

export function ThreadCrmModals({
  modals,
  session,
  messages,
  conversationId,
  colors,
  isDark,
}: ThreadCrmModalsProps) {
  return (
    <>
      {/* Lead Capture Modal (DeltanHub Web LeadCaptureDialog Parity) */}
      <LeadCaptureModal
        visible={modals.isLeadCaptureVisible}
        onClose={modals.closeModal}
        initialFullName={session.conversation?.partnerName || ''}
        onSubmit={session.handleConvertToLead}
      />

      {/* Report Modal */}
      <ReportModal
        visible={modals.isReportVisible}
        targetName={
          session.conversation?.assignedAgent?.fullName ||
          session.conversation?.assignment?.assignedAgentName ||
          session.conversation?.partnerName ||
          'Agent'
        }
        agencyName={
          session.conversation?.agencyName ||
          session.conversation?.assignment?.agencyName ||
          null
        }
        isAssignedAgentReport={Boolean(
          session.conversation?.assignedAgent ||
            session.conversation?.assignment?.assignedAgentUserId
        )}
        onClose={modals.closeModal}
        onSubmitReport={session.handleSubmitReport}
      />

      {/* Lead Management & Brokerage Routing Modal */}
      <ManageAssignmentModal
        visible={modals.isAssignmentVisible}
        onClose={modals.closeModal}
        conversationId={conversationId}
        currentAssignedAgentId={
          session.conversation?.assignment?.assignedAgentUserId ||
          session.conversation?.assigned_to_user_id
        }
        onAssignmentComplete={() => {
          session.fetchConversationDetails();
          messages.fetchMessages();
        }}
      />

      {/* Confidential Lead Internal Notes Modal */}
      <LeadInternalNotesModal
        visible={modals.isInternalNotesVisible}
        onClose={modals.closeModal}
        conversationId={conversationId}
        inquiryId={session.conversation?.assignment?.leadId}
        title="Confidential Lead Notes"
      />

      {/* Quick Status Selection Modal */}
      <QuickStatusModal
        visible={modals.isLeadStatusVisible}
        currentStatus={session.conversation?.assignment?.status}
        colors={colors}
        isDark={isDark}
        onClose={modals.closeModal}
        onSelectStatus={session.handleUpdateLeadStatus}
      />
    </>
  );
}

export default ThreadCrmModals;
