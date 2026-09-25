import { supabase } from '../../supabase';
import { fetchWithAuth } from '../../api-client';
import type { InquiryResponseItem, FormTrigger } from './types';

/**
 * Fetches all inquiry responses submitted from chat questionnaires across
 * conversations where the current user is publisher/agent.
 */
export async function fetchInquiryResponses(): Promise<InquiryResponseItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: participants } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!participants || participants.length === 0) return [];
    const convIds = participants.map((p) => p.conversation_id);

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, conversation_id, sender_user_id, structured_payload, created_at')
      .eq('message_kind', 'inquiry_response')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!messages || messages.length === 0) return [];

    const senderIds = Array.from(new Set(messages.map((m) => m.sender_user_id).filter(Boolean))) as string[];
    let profileMap = new Map<string, string>();
    if (senderIds.length > 0) {
      try {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: senderIds,
        });
        profiles?.forEach((p: { user_id: string; display_name?: string; full_name?: string }) => {
          profileMap.set(p.user_id, p.display_name?.trim() || p.full_name?.trim() || 'User');
        });
      } catch {}
    }

    return messages.map((m) => {
      const payload = m.structured_payload || {};
      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderName: (m.sender_user_id ? profileMap.get(m.sender_user_id) : null) || 'Prospective Buyer',
        senderAvatarUrl: null,
        listingTitle: payload.listingTitle || 'Listing Inquiry',
        createdAt: m.created_at,
        templateTitle: payload.templateTitle || 'Inquiry Form',
        intentTrigger: (payload.intentTrigger as FormTrigger) || 'tour',
        answers: Array.isArray(payload.answers) ? payload.answers : [],
      };
    });
  } catch (err) {
    console.warn('[inquiriesRepository] Direct DB fetch failed, trying API fallback:', err);
  }

  try {
    const data = await fetchWithAuth('/api/dashboard/inquiry-responses');
    if (data && Array.isArray(data.responses)) {
      return data.responses as InquiryResponseItem[];
    }
  } catch (apiErr) {
    console.warn('[inquiriesRepository] API endpoint fallback for responses failed:', apiErr);
  }

  return [];
}
