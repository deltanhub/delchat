import { fetchWithAuth } from '../../lib/api-client';
import { supabase } from '../../lib/supabase';
import type { Contact, ContactSearchResult } from './types';

interface SearchProfileRow {
  user_id: string;
  username?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  main_role?: string | null;
}

function mergeProfileIntoMap(p: SearchProfileRow, contactMap: Map<string, Contact>): void {
  if (!p.user_id) return;
  const existing = contactMap.get(p.user_id);
  const rawUsername = p.username ? p.username.trim().replace(/^@/, '') : null;
  const rawEmail = p.email?.trim() || null;
  const dName = p.display_name?.trim();
  const fName = p.full_name?.trim();

  const title = dName || fName || (rawUsername ? `@${rawUsername}` : (rawEmail || 'User'));

  const subtitleParts: string[] = [];
  if (rawUsername && title !== `@${rawUsername}`) subtitleParts.push(`@${rawUsername}`);
  if (rawEmail && title !== rawEmail) subtitleParts.push(rawEmail);
  if (p.main_role && subtitleParts.length < 2) subtitleParts.push(p.main_role);

  const subtitle = subtitleParts.join(' • ') || p.main_role || 'Member';

  if (existing) {
    contactMap.set(p.user_id, {
      ...existing,
      displayName: existing.displayName || dName || null,
      username: existing.username || rawUsername,
      email: existing.email || rawEmail,
      subtitle: existing.subtitle || subtitle,
    });
  } else {
    contactMap.set(p.user_id, {
      userId: p.user_id,
      fullName: title,
      displayName: dName || null,
      username: rawUsername,
      email: rawEmail,
      avatarUrl: p.avatar_url || null,
      mainRole: p.main_role || 'Member',
      subtitle,
    });
  }
}

/**
 * Searches contacts and users across both DeltanHub API and Supabase RPC / user_profiles.
 * Allows searching by username, display name, full name, and email.
 */
export async function searchContactsAndUsers(query: string): Promise<Contact[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const sanitized = clean.replace(/^@/, '').replace(/[,()]/g, '').trim();
  const contactMap = new Map<string, Contact>();

  // 1. Query DeltanHub API endpoint
  try {
    const data: ContactSearchResult = await fetchWithAuth(
      `/api/chats/contacts?query=${encodeURIComponent(clean)}`
    );
    if (data?.results && Array.isArray(data.results)) {
      data.results.forEach((c) => {
        if (c.userId) contactMap.set(c.userId, c);
      });
    }
  } catch (err) {
    console.log('[contactSearchService] API contact search note:', err);
  }

  // 2. Query Supabase via search_public_user_profiles RPC (bypasses RLS safely)
  if (sanitized.length >= 2) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      const { data: rpcProfiles, error: rpcError } = await supabase.rpc(
        'search_public_user_profiles',
        { query_text: sanitized, limit_count: 25 }
      );

      if (!rpcError && Array.isArray(rpcProfiles)) {
        for (const p of rpcProfiles) {
          if (currentUserId && p.user_id === currentUserId) continue;
          mergeProfileIntoMap(p, contactMap);
        }
      } else {
        // Fallback to direct select if RPC not installed
        let queryBuilder = supabase
          .from('user_profiles')
          .select('user_id, username, display_name, full_name, email, avatar_url, main_role')
          .or(`username.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
          .limit(25);

        if (currentUserId) queryBuilder = queryBuilder.neq('user_id', currentUserId);
        const { data: supaProfiles } = await queryBuilder;
        if (Array.isArray(supaProfiles)) {
          for (const p of supaProfiles) mergeProfileIntoMap(p, contactMap);
        }
      }
    } catch (err) {
      console.warn('[contactSearchService] Supabase user search error:', err);
    }
  }

  return Array.from(contactMap.values());
}
