export type MainTabType = 'chat' | 'manual';

export interface ChatLeadItem {
  id: string;
  conversationId: string | null;
  inquiryId: string | null;
  listingId: string | null;
  source: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed_lost' | 'spam';
  assignedToUserId: string | null;
  createdByUserId: string | null;
  createdAt: string;
  masterLeadStatus?: string | null;
  listingTitle?: string | null;
}

export interface ManualLeadItem {
  id: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string;
  status: 'new' | 'contacted' | 'viewing-scheduled' | 'negotiating' | 'closed' | 'lost';
  propertyType: string | null;
  propertyStatus: string | null;
  propertyLabel: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  message: string | null;
  notes: string | null;
  createdAt: string;
}

export interface StatusOption {
  value: string;
  label: string;
  shortLabel?: string;
  color?: string;
  bgLight?: string;
  bgDark?: string;
}

export const CHAT_LEAD_STATUS_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New', color: '#2563eb', bgLight: '#e7f3ff', bgDark: '#1e3a8a' },
  { value: 'contacted', label: 'Contacted', color: '#d97706', bgLight: '#fff4e0', bgDark: '#78350f' },
  { value: 'qualified', label: 'Qualified', color: '#059669', bgLight: '#e6f6ed', bgDark: '#064e3b' },
  { value: 'converted', label: 'Converted', color: '#2563eb', bgLight: '#e7f3ff', bgDark: '#1e3a8a' },
  { value: 'closed_lost', label: 'Closed (lost)', color: '#6b7280', bgLight: '#f1f1f3', bgDark: '#374151' },
  { value: 'spam', label: 'Spam', color: '#dc2626', bgLight: '#fde6ea', bgDark: '#7f1d1d' },
];

export const MANUAL_LEAD_STATUS_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'All leads', shortLabel: 'All' },
  { value: 'new', label: 'New', shortLabel: 'New', color: '#2563eb', bgLight: '#eff6ff', bgDark: '#1e3a8a' },
  { value: 'contacted', label: 'Contacted', shortLabel: 'Contacted', color: '#d97706', bgLight: '#fffbeb', bgDark: '#78350f' },
  { value: 'viewing-scheduled', label: 'Viewing scheduled', shortLabel: 'Viewing', color: '#059669', bgLight: '#ecfdf5', bgDark: '#064e3b' },
  { value: 'negotiating', label: 'Negotiating', shortLabel: 'Negotiating', color: '#7c3aed', bgLight: '#f5f3ff', bgDark: '#4c1d95' },
  { value: 'closed', label: 'Closed', shortLabel: 'Closed', color: '#16a34a', bgLight: '#f0fdf4', bgDark: '#14532d' },
  { value: 'lost', label: 'Lost', shortLabel: 'Lost', color: '#dc2626', bgLight: '#fef2f2', bgDark: '#7f1d1d' },
];

export const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Land', 'Commercial', 'New development'];
export const PROPERTY_STATUSES = ['For Sale', 'For Rent', 'Short Let', 'New Development'];
