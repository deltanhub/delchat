import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { StarredMessageItem, StarredMessagesScope } from '../../components/chat/starred/types';
import { mapRpcRow, mapFallbackRow } from './starredMappers';

export function useStarredFetch() {
  const [messages, setMessages] = useState<StarredMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStarredMessages = useCallback(async (
    scope: StarredMessagesScope,
    conversationId?: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      const activeConvId = scope === 'current' && conversationId ? conversationId : null;
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_user_starred_messages', {
        p_conversation_id: activeConvId,
        p_limit: 50,
        p_offset: 0,
      });

      if (!rpcErr && Array.isArray(rpcData)) {
        setMessages(rpcData.map(mapRpcRow));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const query = supabase
        .from('chat_starred_messages')
        .select(`id, created_at, message_id, message:chat_messages (id, conversation_id, sender_user_id, sender_type, message_kind, body, intent, structured_payload, created_at, conversation:chat_conversations (id, conversation_kind, title, context_snapshot), attachments:chat_message_attachments (id, attachment_kind, original_name, mime_type, size_bytes, storage_path))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: rows, error: fallbackErr } = await query;
      if (fallbackErr) throw fallbackErr;

      if (rows) {
        const filtered = activeConvId ? rows.filter((r: any) => r.message?.conversation_id === activeConvId) : rows;
        setMessages(filtered.filter((r: any) => r.message).map(mapFallbackRow));
      }
    } catch (err: any) {
      console.warn('[useStarredMessages] Error fetching starred messages:', err);
      setError(err?.message || 'Unable to load starred messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    messages,
    setMessages,
    loading,
    error,
    setError,
    fetchStarredMessages,
  };
}
