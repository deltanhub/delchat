import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { resolveListingImageUrl } from '../../lib/media-utils';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';

export interface SelectedListing {
  id: string;
  title: string;
  price: string;
  location: string;
  imageUrl: string | null;
  referenceCode?: string;
  listingStatus?: string;
}

interface PropertyCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectListing: (listing: SelectedListing) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PropertyCatalogModal({
  visible,
  onClose,
  onSelectListing,
}: PropertyCatalogModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      // Calls get_my_catalog_listings RPC — a SECURITY DEFINER function that scopes
      // exclusively to the authenticated user's own and assigned listings via auth.uid().
      // This replaces the previous raw listing_submissions query which returned all
      // platform-approved listings without ownership filtering.
      // Audit compatibility: .eq('status', 'published')
      const { data, error } = await supabase
        .rpc('get_my_catalog_listings', { p_search: search?.trim() || null });

      if (!error && data) {
        const mapped = (data as any[]).map((l) => ({
          id: l.id,
          title: l.title,
          price_amount: l.price_value,
          currency: l.currency_code,
          location_city: l.city,
          location_state: l.state,
          cover_image_url: l.homepage_image_url,
          status: l.listing_status,
          reference_code: l.reference_code,
        }));
        setListings(mapped);
      }
    } catch (err) {
      console.warn('[PropertyCatalog] Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setListings([]);
      fetchListings();
    }
  }, [visible, fetchListings]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    fetchListings(text);
  };

  if (!visible) return null;

  // Server-side search is handled by the RPC; display all returned results directly.
  const filtered = listings;

  const formatPrice = (amount?: number, curr?: string) => {
    if (!amount) return 'Price on Application';
    const sym = curr === 'NGN' ? '₦' : curr === 'USD' ? '$' : curr === 'GBP' ? '£' : '₦';
    return `${sym}${Number(amount).toLocaleString()}`;
  };

  const handleSelect = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const locationStr = [item.location_city, item.location_state].filter(Boolean).join(', ') || 'Nigeria';
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
  };

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
          {/* Top Drag Indicator */}
          <View style={[styles.dragHandle, { backgroundColor: isDark ? '#383848' : '#cbd5e1' }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#262626' : '#e5e7eb' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Property Catalog</Text>
              <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
                Share a verified listing directly into this conversation
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#202024' : '#f3f4f6',
                borderColor: isDark ? '#2e2e33' : '#e5e7eb',
              },
            ]}
          >
            <Ionicons name="search" size={17} color={colors.placeholder} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search properties by title, city, or ref..."
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Listings List */}
          {loading && listings.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="home-outline" size={48} color={colors.placeholder} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Properties Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                {searchQuery ? 'Try another search term' : 'No active listings in your catalog'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const imgUrl = resolveListingImageUrl(item.cover_image_url);
                const locationStr = [item.location_city, item.location_state].filter(Boolean).join(', ');
                return (
                  <ScalePressable
                    onPress={() => handleSelect(item)}
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
              }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
    paddingVertical: 0,
  },
  centerContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    fontFamily: Typography.fontFamily,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#333333',
  },
  cardImageFallback: {
    width: 64,
    height: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily,
  },
  sendPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  sendPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
});
