import React from 'react';
import { View, Text, Image, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListingData } from './types';
import { styles } from './styles';

interface ListingCardMediaViewProps {
  listing: ListingData;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  placeholderColor: string;
}

export default function ListingCardMediaView({
  listing,
  borderColor,
  backgroundColor,
  textColor,
  placeholderColor,
}: ListingCardMediaViewProps) {
  const handlePress = () => {
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
    const propertyUrl = `${siteUrl}/properties/${listing.id}`;
    Linking.openURL(propertyUrl).catch(() => {
      Alert.alert(
        listing.title || 'Listing Details',
        `Location: ${listing.address || [listing.city, listing.state].filter(Boolean).join(', ') || 'Nigeria'}\nRef: ${listing.referenceCode || listing.id}\n\nView complete details and high-res media online at:\n${propertyUrl}`
      );
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.listingLinkContainer,
        {
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          borderColor,
          backgroundColor,
        },
      ]}
    >
      {listing.imageUrl ? (
        <Image source={{ uri: listing.imageUrl }} style={styles.listingImage} resizeMode="cover" />
      ) : (
        <View style={[styles.listingImagePlaceholder, { backgroundColor: borderColor }]}>
          <Ionicons name="home" size={32} color={placeholderColor} />
        </View>
      )}
      <View style={styles.listingInfo}>
        <Text style={[styles.listingTitleText, { color: textColor }]} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={[styles.listingRefText, { color: placeholderColor }]} numberOfLines={1}>
          {listing.referenceCode ? `Ref: ${listing.referenceCode} · ` : ''}
          {listing.address || [listing.city, listing.state].filter(Boolean).join(', ')}
        </Text>
        <View style={styles.listingBadgeRow}>
          {listing.listingType && (
            <View style={styles.listingTypeBadge}>
              <Text style={styles.listingTypeBadgeText}>{listing.listingType}</Text>
            </View>
          )}
          {listing.listingStatus && (
            <View style={styles.listingStatusBadge}>
              <Text style={styles.listingStatusBadgeText}>{listing.listingStatus}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
