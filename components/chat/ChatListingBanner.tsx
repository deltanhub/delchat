import React from 'react';
import { View } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import {
  ChatListingSummary,
  ChatListingBannerProps,
  styles,
  getListingMetaString,
  getListingStatusBadgeConfig,
  handleOpenListingAction,
  ChatListingThumbnail,
  ChatListingInfoCol,
  ChatListingOpenButton,
} from './listing_banner';

export type { ChatListingSummary, ChatListingBannerProps };

export default function ChatListingBanner({ listing }: ChatListingBannerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  if (!listing || !listing.title) {
    return null;
  }

  const listingMeta = getListingMetaString(listing);
  const statusBadgeConfig = getListingStatusBadgeConfig(listing.listingStatus, isDark);
  const handleOpenListing = () => handleOpenListingAction(listing, listingMeta);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: isDark ? '#121212' : '#ffffff',
          borderBottomColor: isDark ? '#262626' : '#dfe8f1',
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(44, 8, 16, 0.7)' : '#fdf2f4',
            borderColor: isDark ? 'rgba(140, 65, 84, 0.4)' : '#ebdce1',
          },
        ]}
      >
        <ScalePressable
          onPress={handleOpenListing}
          style={styles.contentRow}
          accessibilityLabel={`Linked listing: ${listing.title}`}
        >
          <ChatListingThumbnail imageUrl={listing.imageUrl} isDark={isDark} />
          <ChatListingInfoCol
            title={listing.title}
            listingMeta={listingMeta}
            statusBadgeConfig={statusBadgeConfig}
            isDark={isDark}
          />
        </ScalePressable>

        <ChatListingOpenButton
          onPress={handleOpenListing}
          primaryColor={colors.primary}
        />
      </View>
    </View>
  );
}
