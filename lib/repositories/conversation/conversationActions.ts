import { supabase } from '../../supabase';
import { MuteDuration } from './types';

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_chat_conversation_read_atomic', {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
}

export async function markConversationDelivered(
  conversationId: string,
  messageIds?: string[] | null
): Promise<{ success: boolean; messagesDelivered: number }> {
  try {
    const { data, error } = await supabase.rpc('mark_chat_conversation_delivered_atomic', {
      p_conversation_id: conversationId,
      p_message_ids: messageIds && messageIds.length > 0 ? messageIds : null,
    });
    if (error) return { success: false, messagesDelivered: 0 };
    return {
      success: Boolean(data?.success),
      messagesDelivered: Number(data?.messages_delivered || 0),
    };
  } catch {
    return { success: false, messagesDelivered: 0 };
  }
}

export async function toggleConversationPinned(conversationId: string, willPin: boolean): Promise<void> {
  const { error } = await supabase.rpc('toggle_chat_conversation_pinned_atomic', {
    p_conversation_id: conversationId,
    p_pinned: willPin,
  });
  if (error) throw error;
}

export async function toggleConversationMute(
  conversationId: string,
  currentUserId: string,
  willMute: boolean,
  duration?: MuteDuration
): Promise<void> {
  let muteUntil: string | null = null;
  if (willMute) {
    const effectiveDuration = duration || 'always';
    switch (effectiveDuration) {
      case '8h':
        muteUntil = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
        break;
      case '1w':
        muteUntil = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        break;
      case 'always':
      default:
        muteUntil = '9999-12-31T23:59:59.000Z';
        break;
    }
  }

  const { error } = await supabase
    .from('chat_participants')
    .update({ muted_until: muteUntil })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId);

  if (error) throw error;
}

export async function muteConversation(
  conversationId: string,
  currentUserId: string,
  durationHours: number
): Promise<void> {
  const mutedUntil =
    durationHours === 0
      ? null
      : new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

  const { error } = await supabase
    .from('chat_participants')
    .update({ muted_until: mutedUntil })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId);

  if (error) throw error;
}

export async function toggleConversationArchive(
  conversationId: string,
  currentUserId: string,
  willArchive: boolean
): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .update({ archived_at: willArchive ? new Date().toISOString() : null })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId);

  if (error) throw error;
}

export async function archiveConversation(
  conversationId: string,
  currentUserId: string,
  archive: boolean
): Promise<void> {
  return toggleConversationArchive(conversationId, currentUserId, archive);
}

export async function markConversationUnread(conversationId: string, currentUserId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: null })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId);

  if (error) throw error;
}
