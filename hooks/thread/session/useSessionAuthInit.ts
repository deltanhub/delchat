import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { getCurrentProfile } from '../../../lib/auth';

export function useSessionAuthInit(
  conversationId: string,
  currentUserRef: React.MutableRefObject<any>,
  currentProfileRef: React.MutableRefObject<any>,
  setCurrentUser: (user: any) => void,
  setCurrentProfile: (prof: any) => void,
  fetchConversationDetails: (userOverride?: any) => Promise<void>
) {
  const router = useRouter();

  const ensureParticipantAuthorization = useCallback(async (): Promise<boolean> => {
    const activeUser = currentUserRef.current;
    if (!activeUser || !conversationId) return false;
    try {
      const { data: partRow, error } = await supabase
        .from('chat_participants')
        .select('id, can_send, removed_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', activeUser.id)
        .is('removed_at', null)
        .maybeSingle();

      if (error || !partRow) {
        console.warn('[Security] Unauthorized access attempt to conversation:', conversationId);
        Alert.alert('Access Denied', 'You are not an authorized participant in this conversation.');
        return false;
      }

      if (!partRow.can_send) {
        Alert.alert('Restricted', 'You do not have permission to send messages in this conversation.');
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [conversationId, currentUserRef]);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!isMounted) return;
      if (!user) {
        router.replace('/auth');
        return;
      }
      currentUserRef.current = user;
      setCurrentUser(user);
      const prof = await getCurrentProfile();
      if (!isMounted) return;
      currentProfileRef.current = prof;
      setCurrentProfile(prof);
      void fetchConversationDetails(user);
    });
    return () => {
      isMounted = false;
    };
  }, [conversationId, currentUserRef, currentProfileRef, router, setCurrentUser, setCurrentProfile, fetchConversationDetails]);

  return {
    ensureParticipantAuthorization,
  };
}
