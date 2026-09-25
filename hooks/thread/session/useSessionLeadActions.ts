import { useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { leadsRepository } from '../../../lib/repositories';
import * as Haptics from '../../../lib/haptics';
import type { ChatConversation } from '../../../components/chat/ConversationRow';
import type { UserProfile } from '../../../lib/auth';

export function useSessionLeadActions(
  conversationId: string,
  currentUser: any,
  currentProfile: UserProfile | null,
  conversation: ChatConversation | null,
  setConversation: React.Dispatch<React.SetStateAction<ChatConversation | null>>,
  partnerNameParam: string | undefined,
  showToast: (msg: string) => void,
  fetchConversationDetails: () => Promise<void>,
  fetchInquiryCounts: (inquiryId: string) => Promise<void>
) {
  const handleUpdateLeadStatus = useCallback(async (newStatus: string) => {
    if (!conversation?.assignment?.leadId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const dbStatus = newStatus === 'closed_won' ? 'closed' : newStatus === 'closed_lost' ? 'lost' : newStatus;
      await supabase.from('crm_inquiries').update({
        inquiry_status: dbStatus,
        master_lead_status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', conversation.assignment.leadId);

      setConversation((prev: any) =>
        prev ? { ...prev, assignment: { ...prev.assignment, status: newStatus, masterLeadStatus: newStatus } } : null
      );
    } catch (err: any) {
      Alert.alert('Status Update Failed', err.message);
    }
  }, [conversation?.assignment?.leadId, setConversation]);

  const handleToggleInThreadAgentShare = useCallback(async () => {
    const assignment = conversation?.assignment;
    const leadId = assignment?.leadId;
    if (!assignment || !leadId) return;

    const currentlyEnabled = Boolean(assignment.agentShareEnabled);
    const nextEnabled = !currentlyEnabled;
    const agencyName = conversation?.agencyName || assignment.agencyName || 'Agency';

    const executeToggle = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setConversation((prev: any) =>
        prev ? { ...prev, assignment: { ...prev.assignment, agentShareEnabled: nextEnabled } } : null
      );
      showToast(nextEnabled ? `Thread shared with ${agencyName}` : 'Thread marked as private');

      try {
        const { error } = await supabase.from('crm_inquiries').update({
          agent_share_enabled: nextEnabled,
          agent_share_enabled_at: nextEnabled ? new Date().toISOString() : null,
        }).eq('id', leadId);
        if (error) throw error;
      } catch (err: any) {
        setConversation((prev: any) =>
          prev ? { ...prev, assignment: { ...prev.assignment, agentShareEnabled: currentlyEnabled } } : null
        );
        Alert.alert('Share Toggle Error', err.message || 'Failed to update sharing setting');
      }
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      currentlyEnabled ? 'Make Thread Private?' : `Share Thread with ${agencyName}?`,
      currentlyEnabled ? `Revoke ${agencyName} access?` : `Share conversation with ${agencyName} management?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: currentlyEnabled ? 'Make Private' : 'Share with Agency', onPress: executeToggle, style: currentlyEnabled ? 'destructive' : 'default' },
      ]
    );
  }, [conversation?.assignment, conversation?.agencyName, setConversation, showToast]);

  const handleConvertToLead = useCallback(
    async (draft?: { fullName: string; email?: string; phone?: string; note?: string }) => {
      if (!currentUser || !conversationId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const targetFullName = draft?.fullName || conversation?.partnerName || partnerNameParam || 'Client Lead';

      try {
        const result = await leadsRepository.captureLead({
          conversationId,
          fullName: targetFullName,
          email: draft?.email,
          phone: draft?.phone,
          note: draft?.note,
          currentUserId: currentUser.id,
          partnerUserId: conversation?.partnerUserId || null,
          listingId: conversation?.listing?.id || null,
          createdByName: currentProfile?.displayName || currentUser.email || 'Agent',
        });

        showToast(`Lead created for ${targetFullName}`);
        await fetchConversationDetails();
        if (result?.leadId) void fetchInquiryCounts(result.leadId);
      } catch (err: any) {
        showToast(err?.message || 'Unable to create lead');
        throw err;
      }
    },
    [currentUser, conversationId, conversation?.partnerUserId, conversation?.partnerName, conversation?.listing?.id, partnerNameParam, currentProfile?.displayName, fetchConversationDetails, fetchInquiryCounts, showToast]
  );

  return {
    handleUpdateLeadStatus,
    handleToggleInThreadAgentShare,
    handleConvertToLead,
  };
}
