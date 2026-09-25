import { useRef } from 'react';
import { OfflineEngine } from '../../lib/offline-engine';
import {
  UseThreadSessionParams,
  useSessionState,
  useConversationDetailsFetch,
  useSessionAuthInit,
  useSessionLeadActions,
  useSessionHeaderActions,
  useSessionReportAction,
} from './session';

export type { UseThreadSessionParams } from './session';

export function useThreadSession({
  conversationId,
  partnerNameParam,
  titleParam,
  partnerSubtitleParam,
  listingIdParam,
}: UseThreadSessionParams) {
  // 0ms instant frame-1 hydration from synchronous local cache:
  // OfflineEngine.getConversationSync(conversationId)
  const state = useSessionState(conversationId);

  const fetchConversationDetails = useConversationDetailsFetch(
    conversationId,
    partnerNameParam,
    titleParam,
    partnerSubtitleParam,
    listingIdParam,
    state.currentUserRef,
    state.currentProfileRef,
    state.setConversation,
    state.fetchInquiryCounts
  );

  const fetchConversationDetailsRef = useRef(fetchConversationDetails);
  fetchConversationDetailsRef.current = fetchConversationDetails;

  // Mount initialization: fetches user, profile, and executes:
  // void fetchConversationDetails(user)
  const { ensureParticipantAuthorization } = useSessionAuthInit(
    conversationId,
    state.currentUserRef,
    state.currentProfileRef,
    state.setCurrentUser,
    state.setCurrentProfile,
    fetchConversationDetails
  );

  const leadActions = useSessionLeadActions(
    conversationId,
    state.currentUser,
    state.currentProfile,
    state.conversation,
    state.setConversation,
    partnerNameParam,
    state.showToast,
    fetchConversationDetails,
    state.fetchInquiryCounts
  );

  const headerActions = useSessionHeaderActions(
    conversationId,
    state.currentUser,
    state.conversation,
    state.setConversation,
    state.showToast
  );

  const handleSubmitReport = useSessionReportAction(
    conversationId,
    state.currentUser,
    state.conversation,
    state.fetchInquiryCounts
  );

  return {
    currentUser: state.currentUser,
    currentProfile: state.currentProfile,
    conversation: state.conversation,
    setConversation: state.setConversation,
    fetchConversationDetails,
    ensureParticipantAuthorization,
    ...leadActions,
    ...headerActions,
    handleSubmitReport,
    notesCount: state.notesCount,
    reportsCount: state.reportsCount,
    fetchInquiryCounts: state.fetchInquiryCounts,
    canReportAgent: Boolean(
      state.conversation?.assignedAgent ||
      state.conversation?.assignment?.assignedAgentUserId ||
      state.conversation?.inquiryId
    ),
    toastMessage: state.toastMessage,
    showToast: state.showToast,
    dismissToast: state.dismissToast,
  };
}
