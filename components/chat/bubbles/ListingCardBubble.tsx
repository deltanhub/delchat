import React from 'react';
import { StyleSheet, View, Text, Image, Pressable, Linking, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage, formatMsgTime } from './types';

interface ListingCardBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
}

export default function ListingCardBubble({ message, isCurrentUser, isStarred = false }: ListingCardBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const listing = message.listingCard;
  if (!listing) return null;

  return (
    <Animated.View
      entering={
        isCurrentUser
          ? FadeInDown.duration(280).springify().damping(14).mass(0.7)
          : FadeInUp.duration(240).springify().damping(14).mass(0.7)
      }
      layout={LinearTransition.springify().damping(14)}
      style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}
    >
      <View style={[styles.bubbleContainer, styles.cardWidth]}>
        {!isCurrentUser && (
          <Text style={[styles.authorLabel, { color: isDark ? '#ffffff' : colors.primary }]}>
            {message.authorName}
          </Text>
        )}
        <View
          style={[
            styles.listingCard,
            {
              backgroundColor: isCurrentUser
                ? isDark
                  ? '#1f1318'
                  : '#fdf3f5'
                : colors.card,
              borderColor: isCurrentUser ? (isDark ? '#3a1a24' : 'rgba(74, 15, 31, 0.15)') : colors.border,
            },
          ]}
        >
          <Text style={[styles.badgeTitle, { color: isDark ? '#ffffff' : colors.primary }]}>
            PROPERTY CATALOG
          </Text>

          <Pressable
            onPress={() => {
              const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
              const propertyUrl = `${siteUrl}/property/${listing.id}`;
              Linking.openURL(propertyUrl).catch(() => {
                Alert.alert(
                  listing.title || 'Listing Details',
                  `Location: ${listing.address || [listing.city, listing.state].filter(Boolean).join(', ') || 'Nigeria'}\nRef: ${listing.referenceCode || listing.id}\n\nView complete details and high-res media online at:\n${propertyUrl}`
                );
              });
            }}
            style={({ pressed }) => [
              styles.listingLinkContainer,
              {
                opacity: pressed ? 0.95 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            {listing.imageUrl ? (
              <Image source={{ uri: listing.imageUrl }} style={styles.listingImage} resizeMode="cover" />
            ) : (
              <View style={[styles.listingImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="home" size={32} color={colors.placeholder} />
              </View>
            )}
            <View style={styles.listingInfo}>
              <Text style={[styles.listingTitleText, { color: colors.text }]} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={[styles.listingRefText, { color: colors.placeholder }]} numberOfLines={1}>
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

          {message.body && message.body !== 'Shared property card' && (
            <Text style={[styles.listingBodyText, { color: colors.text }]}>{message.body}</Text>
          )}

          <View style={styles.timeContainer}>
            {isStarred && (
              <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.timeText, { color: colors.placeholder }]}>
              {formatMsgTime(message.sentAt)}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  justifyRight: {
    justifyContent: 'flex-end',
  },
  justifyLeft: {
    justifyContent: 'flex-start',
  },
  bubbleContainer: {
    position: 'relative',
  },
  cardWidth: {
    width: '85%',
  },
  authorLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    paddingLeft: 4,
  },
  listingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  badgeTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  listingLinkContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  listingImage: {
    width: '100%',
    height: 110,
  },
  listingImagePlaceholder: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    padding: 10,
  },
  listingTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listingRefText: {
    fontSize: 11,
    marginTop: 2,
  },
  listingBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  listingTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listingStatusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d97706',
    textTransform: 'uppercase',
  },
  listingBodyText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timeText: {
    fontSize: 10,
  },
});
