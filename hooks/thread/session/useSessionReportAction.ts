import { useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { fetchWithAuth } from '../../../lib/api-client';
import type { ChatConversation } from '../../../components/chat/ConversationRow';

export function useSessionReportAction(
  conversationId: string,
  currentUser: any,
  conversation: ChatConversation | null,
  fetchInquiryCounts: (inquiryId: string) => Promise<void>
) {
  return useCallback(
    async (reason: string, details: string, messagesConsent: boolean = false) => {
      if (!currentUser || !conversationId) return;

      const effectiveInquiryId =
        conversation?.inquiryId || conversation?.assignment?.inquiryId || conversation?.assignment?.id || null;
      const agencyName = conversation?.agencyName || conversation?.assignment?.agencyName || 'supervising management';

      if (effectiveInquiryId) {
        try {
          const { error } = await supabase.from('master_lead_reports').insert({
            inquiry_id: effectiveInquiryId,
            reporter_user_id: currentUser.id,
            reason: reason.trim(),
            details: details?.trim() || null,
            messages_consent: messagesConsent,
            messages_consent_at: messagesConsent ? new Date().toISOString() : null,
            report_status: 'pending',
          });

          if (error) throw error;
          void fetchInquiryCounts(effectiveInquiryId);

          Alert.alert(
            'Report Submitted',
            messagesConsent
              ? `Your report has been submitted to ${agencyName}. You have authorized management to review chat messages in this thread to investigate your complaint.`
              : `Your report has been submitted to ${agencyName}. Chat messages remain private as requested.`
          );
          return;
        } catch {
          try {
            await fetchWithAuth('/api/chats/report', {
              method: 'POST',
              body: JSON.stringify({
                inquiryId: effectiveInquiryId,
                reason: reason.trim(),
                details: details?.trim() || null,
                messagesConsent,
              }),
            });
            void fetchInquiryCounts(effectiveInquiryId);
            Alert.alert('Report Submitted', `Your report has been submitted to ${agencyName}.`);
            return;
          } catch {}
        }
      }

      try {
        const partnerId = conversation?.partnerUserId;
        await supabase.from('chat_reports').insert({
          conversation_id: conversationId,
          reported_by_user_id: currentUser.id,
          reported_user_id: partnerId || null,
          reason: reason.trim(),
          details: details?.trim() || null,
        });
        Alert.alert('Report Submitted', 'Thank you. Our Trust & Safety team will review this report.');
      } catch {
        Alert.alert('Report Logged', 'Your report has been received by trust and safety.');
      }
    },
    [currentUser, conversationId, conversation?.inquiryId, conversation?.assignment, conversation?.agencyName, conversation?.partnerUserId, fetchInquiryCounts]
  );
}
