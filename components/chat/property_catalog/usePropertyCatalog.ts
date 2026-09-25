import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { PropertyCatalogListing } from './types';

export function usePropertyCatalog(visible: boolean) {
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<PropertyCatalogListing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      // Calls get_my_catalog_listings RPC — a SECURITY DEFINER function that scopes
      // exclusively to the authenticated user's own and assigned listings via auth.uid().
      const { data, error } = await supabase
        .rpc('get_my_catalog_listings', { p_search: search?.trim() || null });

      if (!error && data) {
        const mapped: PropertyCatalogListing[] = (data as any[]).map((l) => ({
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

  return {
    searchQuery,
    listings,
    loading,
    handleSearchChange,
  };
}
