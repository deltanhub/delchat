import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { OfflineEngine } from '../../../lib/offline-engine';
import type { ChatConversation } from '../../../components/chat/ConversationRow';
import type { UserProfile } from '../../../lib/auth';

export function useSessionState(conversationId: string) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const currentUserRef = useRef<any>(currentUser);
  currentUserRef.current = currentUser;
  const currentProfileRef = useRef<UserProfile | null>(currentProfile);
  currentProfileRef.current = currentProfile;

  const [conversation, setConversation] = useState<ChatConversation | null>(() => {
    return OfflineEngine.getConversationSync(conversationId);
  });
  const [notesCount, setNotesCount] = useState<number>(0);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const fetchInquiryCounts = useCallback(async (inquiryId: string) => {
    if (!inquiryId) return;
    try {
      const [notesRes, reportsRes] = await Promise.all([
        supabase
          .from('master_lead_internal_notes')
          .select('id', { count: 'exact', head: true })
          .eq('inquiry_id', inquiryId),
        supabase
          .from('master_lead_reports')
          .select('id', { count: 'exact', head: true })
          .eq('inquiry_id', inquiryId),
      ]);
      setNotesCount(notesRes.count ?? 0);
      setReportsCount(reportsRes.count ?? 0);
    } catch {
      // Non-critical counter sync
    }
  }, []);

  useEffect(() => {
    if (!conversation && conversationId) {
      void OfflineEngine.getConversations().then((cachedList) => {
        const found = cachedList.find((c) => c.id === conversationId);
        if (found) {
          setConversation((prev) => prev || found);
        }
      });
    }
  }, [conversationId, conversation]);

  return {
    currentUser,
    setCurrentUser,
    currentProfile,
    setCurrentProfile,
    currentUserRef,
    currentProfileRef,
    conversation,
    setConversation,
    notesCount,
    setNotesCount,
    reportsCount,
    setReportsCount,
    toastMessage,
    showToast,
    dismissToast,
    fetchInquiryCounts,
  };
}
