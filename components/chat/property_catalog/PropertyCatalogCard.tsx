import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import { resolveListingImageUrl } from '../../../lib/media-utils';
import { styles } from './styles';
import { formatPrice } from './formatters';
import type { PropertyCatalogListing } from './types';

interface PropertyCatalogCardProps {
  item: PropertyCatalogListing;
  isDark: boolean;
  colors: { text: string; placeholder: string; primary: string };
  onSelect: (item: PropertyCatalogListing) => void;
}

export function PropertyCatalogCard({ item, isDark, colors, onSelect }: PropertyCatalogCardProps) {
  const imgUrl = resolveListingImageUrl(item.cover_image_url);
  const locationStr = [item.location_city, item.location_state].filter(Boolean).join(', ');

  return (
    <ScalePressable
      onPress={() => onSelect(item)}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1c1c20' : '#f9fafb',
          borderColor: isDark ? '#2c2c32' : '#e5e7eb',
        },
      ]}
    >
      {imgUrl ? (
        <Image source={{ uri: imgUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImageFallback, { backgroundColor: isDark ? '#2a2a30' : '#e5e7eb' }]}>
          <Ionicons name="image-outline" size={24} color={colors.placeholder} />
        </View>
      )}

      <View style={styles.cardDetails}>
        <Text style={[styles.cardPrice, { color: isDark ? '#f4a5b8' : colors.primary }]}>
          {formatPrice(item.price_amount, item.currency)}
        </Text>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        {locationStr ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.placeholder} />
            <Text style={[styles.locationText, { color: colors.placeholder }]} numberOfLines={1}>
              {locationStr}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.sendPill, { backgroundColor: colors.primary }]}>
        <Text style={styles.sendPillText}>Send</Text>
      </View>
    </ScalePressable>
  );
}
