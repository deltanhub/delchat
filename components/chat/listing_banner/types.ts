export interface ChatListingSummary {
  id: string;
  title: string;
  imageUrl: string | null;
  referenceCode?: string | null;
  address?: string;
  city?: string;
  state?: string;
  listingStatus?: string | null;
  listingType?: string | null;
}

export interface ChatListingBannerProps {
  listing: ChatListingSummary;
}

export interface StatusBadgeConfig {
  label: string;
  bg: string;
  text: string;
}

export interface ChatListingThumbnailProps {
  imageUrl: string | null;
  isDark: boolean;
}

export interface ChatListingInfoColProps {
  title: string;
  listingMeta: string;
  statusBadgeConfig: StatusBadgeConfig | null;
  isDark: boolean;
}

export interface ChatListingOpenButtonProps {
  onPress: () => void;
  primaryColor: string;
}
