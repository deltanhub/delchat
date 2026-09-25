import { supabase } from '../../supabase';

export async function toggleMessageStar(messageId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_chat_message_star', {
    p_message_id: messageId,
  });
  if (error) throw error;
}

export async function toggleMessageReaction(messageId: string, emoji: string): Promise<Record<string, string[]>> {
  const { data: updatedReactions, error } = await supabase.rpc('toggle_chat_message_reaction', {
    p_message_id: messageId,
    p_emoji: emoji,
  });
  if (error) throw error;
  return updatedReactions;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
  if (error) throw error;
}

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
    if (error) {
      console.warn('[messageRepository] markConversationDelivered error:', error.message);
      return { success: false, messagesDelivered: 0 };
    }
    return {
      success: Boolean(data?.success),
      messagesDelivered: Number(data?.messages_delivered || 0),
    };
  } catch (err: any) {
    console.warn('[messageRepository] markConversationDelivered catch:', err?.message);
    return { success: false, messagesDelivered: 0 };
  }
}
