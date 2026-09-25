import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { formatMsgTime } from './types';
import { ListingCardBubbleProps, styles, ListingCardMediaView } from './listing_card';

export { ListingCardBubbleProps };

export default function ListingCardBubble({
  message,
  isCurrentUser,
  isStarred = false,
}: ListingCardBubbleProps) {
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

          <ListingCardMediaView
            listing={listing}
            borderColor={colors.border}
            backgroundColor={colors.background}
            textColor={colors.text}
            placeholderColor={colors.placeholder}
          />

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
