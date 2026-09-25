import { supabase } from '../../../lib/supabase';
import { resolveAvatarUrl } from '../../../lib/media-utils';
import { CallPartnerInfo } from './types';

export async function resolveCallPartner(
  conversationId: string,
  currentUserId: string
): Promise<CallPartnerInfo | null> {
  const { data: participants } = await supabase
    .from('chat_participants')
    .select('user_id, participant_role')
    .eq('conversation_id', conversationId);

  const partner = (participants || []).find((p: any) => p.user_id !== currentUserId);
  if (!partner?.user_id) return null;

  const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
    requested_user_ids: [partner.user_id],
  });

  const profile = profiles && profiles[0];
  return {
    userId: partner.user_id,
    name: profile?.display_name?.trim() || profile?.full_name?.trim() || 'Partner',
    avatarUrl: resolveAvatarUrl(profile?.avatar_url),
    role: partner.participant_role || 'Member',
  };
}
