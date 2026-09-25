export interface SelectedListing {
  id: string;
  title: string;
  price: string;
  location: string;
  imageUrl: string | null;
  referenceCode?: string;
  listingStatus?: string;
}

export interface PropertyCatalogListing {
  id: string;
  title: string;
  price_amount?: number;
  currency?: string;
  location_city?: string;
  location_state?: string;
  cover_image_url?: string;
  status?: string;
  reference_code?: string;
}

export interface PropertyCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectListing: (listing: SelectedListing) => void;
}
