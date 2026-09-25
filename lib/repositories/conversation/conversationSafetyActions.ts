import { supabase } from '../../supabase';

export async function toggleChatUserBlock(targetUserId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_chat_user_block', {
    p_target_user_id: targetUserId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function checkChatBlockedStatus(
  currentUserId: string,
  targetUserId: string
): Promise<{ isBlocked: boolean; blockedByMe: boolean; hasBlockedMe: boolean }> {
  const { data, error } = await supabase
    .from('chat_blocked_users')
    .select('blocker_user_id, blocked_user_id')
    .or(`blocker_user_id.eq.${currentUserId},blocked_user_id.eq.${currentUserId}`);

  if (error || !data) {
    return { isBlocked: false, blockedByMe: false, hasBlockedMe: false };
  }

  const blockedByMe = data.some(
    (b: any) => b.blocker_user_id === currentUserId && b.blocked_user_id === targetUserId
  );
  const hasBlockedMe = data.some(
    (b: any) => b.blocker_user_id === targetUserId && b.blocked_user_id === currentUserId
  );

  return { isBlocked: blockedByMe || hasBlockedMe, blockedByMe, hasBlockedMe };
}

export async function toggleConversationFavorite(
  conversationId: string,
  willFavorite?: boolean
): Promise<{ success: boolean; isFavorited: boolean; favoritedAt: string | null }> {
  const { data, error } = await supabase.rpc('toggle_chat_conversation_favorite_atomic', {
    p_conversation_id: conversationId,
    p_favorited: willFavorite !== undefined ? willFavorite : null,
  });
  if (error) throw error;
  return {
    success: Boolean(data?.success),
    isFavorited: Boolean(data?.is_favorited),
    favoritedAt: data?.favorited_at || null,
  };
}

export async function clearConversationHistory(
  conversationId: string,
  currentUserId?: string
): Promise<{ success: boolean; clearedHistoryAt: string }> {
  const { data, error } = await supabase.rpc('clear_chat_conversation_history_atomic', {
    p_conversation_id: conversationId,
  });

  if (error) {
    if (currentUserId) {
      const fallbackIso = new Date().toISOString();
      await supabase
        .from('chat_participants')
        .update({ cleared_history_at: fallbackIso })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
      return { success: true, clearedHistoryAt: fallbackIso };
    }
    throw error;
  }

  return {
    success: Boolean(data?.success),
    clearedHistoryAt: data?.cleared_history_at || new Date().toISOString(),
  };
}

export async function deleteConversation(conversationId: string, currentUserId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .update({ removed_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId);

  if (error) throw error;
}
