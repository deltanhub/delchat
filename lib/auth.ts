import * as Roles from './auth/roles';
import { getCurrentProfile, clearProfileCache as clearCache } from './auth/profileFetcher';

export type DeltanHubRole = Roles.DeltanHubRole;
export type AppProfile = Roles.AppProfile;
export type UserProfile = Roles.UserProfile;

export function normalizeRole(rawRole?: string | null): DeltanHubRole {
  return Roles.normalizeRole(rawRole);
}

export function isProfessionalRole(role?: string | null): boolean {
  return Roles.isProfessionalRole(role);
}

export function canReceiveLeads(role?: string | null): boolean {
  return Roles.canReceiveLeads(role);
}

export function canAssignAgents(role?: string | null): boolean {
  return Roles.canAssignAgents(role);
}

export function isAgencyOrDeveloper(role?: string | null): boolean {
  return Roles.isAgencyOrDeveloper(role);
}

export function isAgent(role?: string | null): boolean {
  return Roles.isAgent(role);
}

export function isLandlord(role?: string | null): boolean {
  return Roles.isLandlord(role);
}

export function isBuyer(role?: string | null): boolean {
  return Roles.isBuyer(role);
}

export function formatRoleLabel(role?: string | null): string {
  return Roles.formatRoleLabel(role);
}

export function clearProfileCache(): void {
  clearCache();
}

export { getCurrentProfile };
