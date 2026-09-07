import React from 'react';
import { StyleSheet, View, Text, Image, Linking, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';
import WatermarkOverlay from '../WatermarkOverlay';

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

interface ChatListingBannerProps {
  listing: ChatListingSummary;
}

/**
 * ChatListingBanner (ListingContextCard)
 * Native 1:1 replication of DeltanHub Web's ListingContextCard
 * (deltanhub/app/chats/chats-workspace.tsx:L6020-L6063)
 */
export default function ChatListingBanner({ listing }: ChatListingBannerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  if (!listing || !listing.title) {
    return null;
  }

  const listingMeta = [listing.listingType, listing.city, listing.state]
    .filter(Boolean)
    .join(' · ');

  const handleOpenListing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
    const propertyUrl = `${siteUrl}/property/${listing.id}`;

    Linking.openURL(propertyUrl).catch(() => {
      Alert.alert(
        listing.title,
        `Location: ${listing.address || listingMeta || 'Nigeria'}\nRef: ${listing.referenceCode || listing.id}\n\nView complete details and high-res media online at:\n${propertyUrl}`
      );
    });
  };

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
          <View style={[styles.imageContainer, { backgroundColor: isDark ? '#262626' : '#d6dde5' }]}>
            {listing.imageUrl ? (
              <>
                <Image
                  source={{ uri: listing.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <WatermarkOverlay size="xs" opacity={0.35} />
              </>
            ) : (
              <View style={styles.placeholder}>
                <Text style={[styles.placeholderText, { color: isDark ? '#9ca3af' : '#748397' }]}>
                  Listing
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoCol}>
            <Text style={[styles.tagText, { color: isDark ? '#f4a5b8' : '#be123c' }]}>
              LINKED LISTING
            </Text>
            <Text
              style={[styles.titleText, { color: isDark ? '#ffffff' : '#10243a' }]}
              numberOfLines={1}
            >
              {listing.title}
            </Text>
            {listingMeta ? (
              <Text
                style={[styles.metaText, { color: isDark ? '#9ca3af' : '#60748c' }]}
                numberOfLines={1}
              >
                {listingMeta}
              </Text>
            ) : null}
          </View>
        </ScalePressable>

        <ScalePressable
          onPress={handleOpenListing}
          style={[styles.openButton, { backgroundColor: colors.primary }]}
          accessibilityLabel="Open listing"
        >
          <Text style={styles.openButtonText}>Open</Text>
        </ScalePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  titleText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    lineHeight: 16,
    marginTop: 1,
  },
  openButton: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
});
