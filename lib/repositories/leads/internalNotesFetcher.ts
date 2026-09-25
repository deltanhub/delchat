import { supabase } from '../../supabase';
import { fetchWithAuth } from '../../api-client';
import { InternalNoteItem } from './types';

/**
 * Fetches internal broker notes for a lead inquiry.
 * Hits DeltanHub Web API /api/dashboard/master-leads/${activeInqId}/notes with resilient Supabase fallback.
 */
export async function fetchInternalNotes(params: {
  inquiryId?: string | null;
  conversationId?: string | null;
}): Promise<{ inquiryId: string | null; notes: InternalNoteItem[] }> {
  const { inquiryId, conversationId } = params;
  let activeInqId = inquiryId || null;

  if (!activeInqId && conversationId) {
    const { data: inqRow } = await supabase
      .from('crm_inquiries')
      .select('id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (inqRow) activeInqId = inqRow.id;
  }

  if (activeInqId) {
    try {
      const res = await fetchWithAuth(`/api/dashboard/master-leads/${activeInqId}/notes`);
      if (res && Array.isArray(res.notes)) {
        const mapped: InternalNoteItem[] = res.notes.map((n: any) => ({
          id: n.id,
          inquiryId: activeInqId,
          inquiry_id: activeInqId,
          authorUserId: n.authorUserId,
          author_user_id: n.authorUserId,
          authorName: n.authorName || 'Team Member',
          author_name: n.authorName || 'Team Member',
          body: n.body,
          visibility: n.visibility || 'company_and_agent',
          createdAt: n.createdAt,
          created_at: n.createdAt,
        }));
        return { inquiryId: activeInqId, notes: mapped };
      }
    } catch (apiErr: any) {
      console.log('[leadsRepository] fetchInternalNotes API fallback to Supabase:', apiErr?.message);
    }

    const { data: noteRows, error: noteErr } = await supabase
      .from('master_lead_internal_notes')
      .select('id, inquiry_id, author_user_id, body, visibility, created_at')
      .eq('inquiry_id', activeInqId)
      .order('created_at', { ascending: false });

    if (!noteErr && noteRows && noteRows.length > 0) {
      const authorIds = Array.from(new Set(noteRows.map((n: any) => n.author_user_id).filter(Boolean)));
      let profileMap = new Map<string, string>();
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, full_name')
          .in('user_id', authorIds);
        (profiles || []).forEach((p: any) => {
          profileMap.set(p.user_id, p.display_name || p.full_name || 'Agent');
        });
      }

      return {
        inquiryId: activeInqId,
        notes: noteRows.map((n: any) => {
          const authorName = profileMap.get(n.author_user_id) || 'Team Member';
          return {
            id: n.id,
            inquiryId: activeInqId,
            inquiry_id: activeInqId,
            authorUserId: n.author_user_id,
            author_user_id: n.author_user_id,
            authorName,
            author_name: authorName,
            body: n.body,
            visibility: n.visibility || 'company_and_agent',
            createdAt: n.created_at,
            created_at: n.created_at,
          };
        }),
      };
    }
  }

  if (conversationId) {
    const { data: msgRows, error: msgErr } = await supabase
      .from('chat_messages')
      .select('id, sender_user_id, body, created_at')
      .eq('conversation_id', conversationId)
      .eq('intent', 'internal_note')
      .order('created_at', { ascending: false });

    if (!msgErr && msgRows) {
      const authorIds = Array.from(new Set(msgRows.map((m: any) => m.sender_user_id).filter(Boolean)));
      let nameMap = new Map<string, string>();
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, full_name')
          .in('user_id', authorIds);
        (profiles || []).forEach((p: any) => {
          nameMap.set(p.user_id, p.display_name || p.full_name || 'Agent');
        });
      }

      return {
        inquiryId: activeInqId,
        notes: msgRows.map((m: any) => ({
          id: m.id,
          authorUserId: m.sender_user_id,
          author_user_id: m.sender_user_id,
          authorName: nameMap.get(m.sender_user_id) || 'Team Member',
          author_name: nameMap.get(m.sender_user_id) || 'Team Member',
          body: m.body,
          visibility: 'company_and_agent' as const,
          createdAt: m.created_at,
          created_at: m.created_at,
        })),
      };
    }
  }

  return { inquiryId: activeInqId, notes: [] };
}
