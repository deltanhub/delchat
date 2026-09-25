import React, { useCallback } from 'react';
import { Modal, Pressable, View, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';
import { resolveListingImageUrl } from '../../lib/media-utils';
import {
  styles,
  formatPrice,
  formatLocation,
  usePropertyCatalog,
  PropertyCatalogHeader,
  PropertyCatalogSearchBar,
  PropertyCatalogCard,
  PropertyCatalogEmptyState,
} from './property_catalog';
import type { SelectedListing, PropertyCatalogModalProps, PropertyCatalogListing } from './property_catalog';

export type { SelectedListing, PropertyCatalogModalProps };

/**
 * PropertyCatalogModal
 * Clean Architecture slim presenter for the conversation listing sharing picker.
 * Exclusively queries verified user listings via supabase.rpc('get_my_catalog_listings').
 */
export default function PropertyCatalogModal({
  visible,
  onClose,
  onSelectListing,
}: PropertyCatalogModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const { searchQuery, listings, loading, handleSearchChange } = usePropertyCatalog(visible);

  const handleSelect = useCallback(
    (item: PropertyCatalogListing) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const locationStr = formatLocation(item.location_city, item.location_state);
      onSelectListing({
        id: item.id,
        title: item.title || 'Exclusive Property',
        price: formatPrice(item.price_amount, item.currency),
        location: locationStr,
        imageUrl: resolveListingImageUrl(item.cover_image_url),
        referenceCode: item.reference_code || undefined,
        listingStatus: item.status || 'for_sale',
      });
      onClose();
    },
    [onSelectListing, onClose]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#141416' : '#ffffff',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <PropertyCatalogHeader isDark={isDark} colors={colors} onClose={onClose} />

          <PropertyCatalogSearchBar
            searchQuery={searchQuery}
            isDark={isDark}
            colors={colors}
            onChangeText={handleSearchChange}
          />

          {loading && listings.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : listings.length === 0 ? (
            <PropertyCatalogEmptyState searchQuery={searchQuery} colors={colors} />
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <PropertyCatalogCard
                  item={item}
                  isDark={isDark}
                  colors={colors}
                  onSelect={handleSelect}
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
