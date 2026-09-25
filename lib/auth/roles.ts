export type DeltanHubRole = 'Agency' | 'Developer' | 'Agent' | 'Landlord/Owner' | 'Buyer';

export interface AppProfile {
  id: string;
  email: string;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  mainRole: DeltanHubRole;
  isVerified?: boolean;
  phone?: string | null;
}

export type UserProfile = AppProfile;

export function normalizeRole(rawRole?: string | null): DeltanHubRole {
  if (!rawRole) return 'Buyer';
  const r = rawRole.trim().toLowerCase();
  if (r === 'agency') return 'Agency';
  if (r === 'developer') return 'Developer';
  if (r === 'agent') return 'Agent';
  if (r === 'landlord' || r === 'landlord/owner' || r === 'owner') return 'Landlord/Owner';
  return 'Buyer';
}

export function isProfessionalRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);
  return (
    normalized === 'Agency' ||
    normalized === 'Developer' ||
    normalized === 'Agent' ||
    normalized === 'Landlord/Owner'
  );
}

export function canReceiveLeads(role?: string | null): boolean {
  return isProfessionalRole(role);
}

export function canAssignAgents(role?: string | null): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);
  return normalized === 'Agency' || normalized === 'Developer';
}

export function isAgencyOrDeveloper(role?: string | null): boolean {
  return canAssignAgents(role);
}

export function isAgent(role?: string | null): boolean {
  if (!role) return false;
  return normalizeRole(role) === 'Agent';
}

export function isLandlord(role?: string | null): boolean {
  if (!role) return false;
  return normalizeRole(role) === 'Landlord/Owner';
}

export function isBuyer(role?: string | null): boolean {
  if (!role) return true;
  return normalizeRole(role) === 'Buyer';
}

export function formatRoleLabel(role?: string | null): string {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'Agency':
      return 'Agency Brokerage';
    case 'Developer':
      return 'Property Developer';
    case 'Agent':
      return 'Licensed Agent';
    case 'Landlord/Owner':
      return 'Property Host / Owner';
    case 'Buyer':
      return 'Verified Buyer';
    default:
      return 'DeltanHub Member';
  }
}
