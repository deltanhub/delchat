import { Linking, Alert } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { ChatListingSummary, StatusBadgeConfig } from './types';

export function getListingMetaString(listing: ChatListingSummary): string {
  return [listing.listingType, listing.city, listing.state]
    .filter(Boolean)
    .join(' · ');
}

export function getListingStatusBadgeConfig(
  listingStatus: string | null | undefined,
  isDark: boolean
): StatusBadgeConfig | null {
  const normalizedStatus = (listingStatus || '').trim().toLowerCase();
  const isSold = normalizedStatus.includes('sold');
  const isRented = normalizedStatus.includes('rented');
  const isOffer = normalizedStatus.includes('offer') || normalizedStatus.includes('pending');
  const isOffMarket =
    normalizedStatus.includes('inactive') ||
    normalizedStatus.includes('delist') ||
    normalizedStatus.includes('off market');
  const isForSale = normalizedStatus.includes('sale');
  const isForRent = normalizedStatus.includes('rent') && !isRented;

  if (isSold) {
    return { label: 'SOLD', bg: isDark ? '#450a0a' : '#fef2f2', text: isDark ? '#fca5a5' : '#dc2626' };
  }
  if (isRented) {
    return { label: 'RENTED', bg: isDark ? '#2e1065' : '#f5f3ff', text: isDark ? '#d8b4fe' : '#7c3aed' };
  }
  if (isOffer) {
    return { label: 'UNDER OFFER', bg: isDark ? '#451a03' : '#fffbeb', text: isDark ? '#fcd34d' : '#d97706' };
  }
  if (isOffMarket) {
    return { label: 'OFF MARKET', bg: isDark ? '#1e293b' : '#f1f5f9', text: isDark ? '#94a3b8' : '#64748b' };
  }
  if (isForSale) {
    return { label: 'FOR SALE', bg: isDark ? '#14532d' : '#f0fdf4', text: isDark ? '#86efac' : '#16a34a' };
  }
  if (isForRent) {
    return { label: 'FOR RENT', bg: isDark ? '#1e1b4b' : '#eef2ff', text: isDark ? '#a5b4fc' : '#4f46e5' };
  }
  if (listingStatus) {
    return {
      label: listingStatus.toUpperCase(),
      bg: isDark ? '#1e293b' : '#f1f5f9',
      text: isDark ? '#94a3b8' : '#64748b',
    };
  }
  return null;
}

export function handleOpenListingAction(listing: ChatListingSummary, listingMeta: string) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
  const propertyUrl = `${siteUrl}/properties/${listing.id}`;

  Linking.openURL(propertyUrl).catch(() => {
    Alert.alert(
      listing.title,
      `Status: ${listing.listingStatus || 'Active'}\nLocation: ${
        listing.address || listingMeta || 'Nigeria'
      }\nRef: ${listing.referenceCode || listing.id}\n\nView complete details and high-res media online at:\n${propertyUrl}`
    );
  });
}
