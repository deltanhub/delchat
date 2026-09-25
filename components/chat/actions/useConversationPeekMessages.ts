import { useState, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { supabase } from '../../../lib/supabase';
import { ChatConversation } from '../ConversationRow';
import { PeekMessage } from './types';

export function useConversationPeekMessages(
  visible: boolean,
  conversation: ChatConversation | null
) {
  const [recentMessages, setRecentMessages] = useState<PeekMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && conversation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);

      (async () => {
        try {
          let query = supabase
            .from('chat_messages')
            .select('id, sender_user_id, body, created_at, message_kind')
            .eq('conversation_id', conversation.id);

          if (conversation.clearedHistoryAt) {
            query = query.gt('created_at', conversation.clearedHistoryAt);
          }

          const { data } = await query
            .order('created_at', { ascending: false })
            .limit(10);

          setRecentMessages((data as PeekMessage[]) ? [...(data as PeekMessage[])].reverse() : []);
        } catch {
          setRecentMessages([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [visible, conversation]);

  return {
    recentMessages,
    loading,
    scrollViewRef,
  };
}

export default useConversationPeekMessages;
