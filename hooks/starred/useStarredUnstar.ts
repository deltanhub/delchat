import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import * as Haptics from '../../lib/haptics';
import type { StarredMessageItem } from '../../components/chat/starred/types';

export function useStarredUnstar(
  setMessages: React.Dispatch<React.SetStateAction<StarredMessageItem[]>>,
  onUnstarMessage?: (messageId: string) => void
) {
  const handleUnstar = useCallback(async (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
    onUnstarMessage?.(messageId);

    try {
      const { error: rpcErr } = await supabase.rpc('toggle_chat_message_star', { p_message_id: messageId });
      if (rpcErr) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase.from('chat_starred_messages').delete().eq('user_id', authData.user.id).eq('message_id', messageId);
        }
      }
    } catch (err) {
      console.warn('[useStarredMessages] Failed to unstar message:', err);
    }
  }, [setMessages, onUnstarMessage]);

  return { handleUnstar };
}
