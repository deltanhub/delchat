import { supabase } from '../../supabase';
import { resolveAvatarUrl } from '../../media-utils';
import { BrokerageAgent } from './types';

/**
 * Fetches eligible brokerage agents scoped to the active organization memberships.
 * Strictly verifies tenant isolation across agency_agent_memberships and developer_agent_memberships.
 */
export async function fetchBrokerageAgents(
  currentUserId: string,
  conversationId?: string
): Promise<BrokerageAgent[]> {
  const tenantIds = new Set<string>();
  tenantIds.add(currentUserId);

  if (conversationId) {
    const { data: inq } = await supabase
      .from('crm_inquiries')
      .select('agency_user_id, developer_user_id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (inq?.agency_user_id) tenantIds.add(inq.agency_user_id);
    if (inq?.developer_user_id) tenantIds.add(inq.developer_user_id);
  }

  const { data: myMemberships } = await supabase
    .from('agency_agent_memberships')
    .select('agency_user_id')
    .eq('agent_user_id', currentUserId)
    .eq('membership_status', 'active');

  myMemberships?.forEach((m: any) => {
    if (m.agency_user_id) tenantIds.add(m.agency_user_id);
  });

  const tenantIdArray = Array.from(tenantIds);

  const { data: agencyMembers } = await supabase
    .from('agency_agent_memberships')
    .select('agent_user_id, position_title, relationship_kind')
    .in('agency_user_id', tenantIdArray)
    .eq('membership_status', 'active');

  const { data: devMembers } = await supabase
    .from('developer_agent_memberships')
    .select('agent_user_id, position_title, relationship_kind')
    .in('developer_user_id', tenantIdArray)
    .eq('membership_status', 'active');

  const candidateUserIds = new Set<string>();
  const agentMetaMap = new Map<string, { agentType: 'internal' | 'external'; positionTitle?: string | null }>();

  agencyMembers?.forEach((m: any) => {
    if (m.agent_user_id && !tenantIds.has(m.agent_user_id)) {
      candidateUserIds.add(m.agent_user_id);
      agentMetaMap.set(m.agent_user_id, {
        agentType: m.relationship_kind === 'external' ? 'external' : 'internal',
        positionTitle: m.position_title || null,
      });
    }
  });

  devMembers?.forEach((m: any) => {
    if (m.agent_user_id && !tenantIds.has(m.agent_user_id)) {
      candidateUserIds.add(m.agent_user_id);
      if (!agentMetaMap.has(m.agent_user_id)) {
        agentMetaMap.set(m.agent_user_id, {
          agentType: m.relationship_kind === 'external' ? 'external' : 'internal',
          positionTitle: m.position_title || null,
        });
      }
    }
  });

  candidateUserIds.delete(currentUserId);
  tenantIds.forEach((tId) => candidateUserIds.delete(tId));

  const candidateArray = Array.from(candidateUserIds);
  if (candidateArray.length === 0) return [];

  const { data: profiles, error: rpcError } = await supabase.rpc('get_public_user_profiles', {
    requested_user_ids: candidateArray,
  });

  if (rpcError) throw rpcError;
  if (!profiles) return [];

  return profiles.map((p: any) => {
    const meta = agentMetaMap.get(p.user_id);
    const isExternal = meta?.agentType === 'external' || p.agent_account_kind === 'external';

    return {
      userId: p.user_id,
      name: p.display_name?.trim() || p.full_name?.trim() || 'Agent',
      email: undefined,
      phone: undefined,
      avatarUrl: resolveAvatarUrl(p.avatar_url),
      role:
        meta?.positionTitle ||
        (p.main_role === 'agency'
          ? 'Principal Broker'
          : p.main_role === 'developer'
          ? 'Lead Developer'
          : p.main_role === 'manager'
          ? 'Sales Manager'
          : 'Licensed Agent'),
      agentType: (isExternal ? 'external' : 'internal') as 'internal' | 'external',
      positionTitle: meta?.positionTitle || null,
    };
  });
}
