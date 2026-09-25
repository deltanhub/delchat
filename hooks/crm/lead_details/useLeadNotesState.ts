import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { leadsRepository } from '../../../lib/repositories/leadsRepository';
import type { InternalNoteItem } from '../../../components/chat/crm/types';
import type { UseLeadNotesStateParams, UseLeadNotesStateReturn } from './types';

export function useLeadNotesState({
  inquiryId,
  conversationId,
  currentUserId,
  onNotesCountChange,
}: UseLeadNotesStateParams): UseLeadNotesStateReturn {
  const [notes, setNotes] = useState<InternalNoteItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'company_only' | 'company_and_agent'>('company_and_agent');
  const [postingNote, setPostingNote] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!inquiryId && !conversationId) return;
    setLoadingNotes(true);
    try {
      const result = await leadsRepository.fetchInternalNotes({ inquiryId, conversationId });
      const mappedNotes: InternalNoteItem[] = (result.notes || []).map((n) => ({
        id: n.id,
        inquiry_id: n.inquiry_id || n.inquiryId || inquiryId || '',
        author_user_id: n.author_user_id || n.authorUserId || '',
        author_name: n.author_name || n.authorName || 'Team Member',
        body: n.body,
        visibility: (n.visibility || 'company_and_agent') as 'company_only' | 'company_and_agent',
        created_at: n.created_at || n.createdAt || new Date().toISOString(),
      }));
      setNotes(mappedNotes);
      onNotesCountChange?.(mappedNotes.length);
    } catch (err) {
      console.warn('[useLeadNotesState] Error loading notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  }, [inquiryId, conversationId, onNotesCountChange]);

  const handleCreateNote = async () => {
    if (!newNoteText.trim() || !inquiryId || !currentUserId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPostingNote(true);
    try {
      const noteBody = newNoteText.trim();
      const res = await leadsRepository.addInternalNote({
        inquiryId,
        authorUserId: currentUserId,
        body: noteBody,
        visibility: noteVisibility,
      });
      const createdItem: InternalNoteItem = {
        id: res?.id || String(Date.now()),
        inquiry_id: inquiryId,
        author_user_id: currentUserId,
        author_name: 'You',
        body: noteBody,
        visibility: noteVisibility,
        created_at: new Date().toISOString(),
      };
      setNewNoteText('');
      setNotes((prev) => [createdItem, ...prev]);
      onNotesCountChange?.(notes.length + 1);
    } catch (err: any) {
      Alert.alert('Note Error', err.message || 'Failed to post internal note');
    } finally {
      setPostingNote(false);
    }
  };

  return {
    notes,
    loadingNotes,
    newNoteText,
    setNewNoteText,
    noteVisibility,
    setNoteVisibility,
    postingNote,
    loadNotes,
    handleCreateNote,
  };
}
