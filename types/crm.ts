export type MainTabType = 'chat' | 'manual';

export type ChatLeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed_lost' | 'spam';

export type ManualLeadStatus = 'new' | 'contacted' | 'viewing-scheduled' | 'negotiating' | 'closed' | 'lost';

export interface CrmLead {
  id: string;
  conversationId: string | null;
  inquiryId: string | null;
  listingId: string | null;
  source: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  status: ChatLeadStatus;
  assignedToUserId: string | null;
  createdByUserId: string | null;
  createdAt: string;
  masterLeadStatus?: string | null;
  listingTitle?: string | null;
}

export interface ManualLead {
  id: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string;
  status: ManualLeadStatus;
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

export interface DashboardCrmEntry {
  id: string;
  user_id: string;
  entry_type: 'lead' | 'inquiry' | 'task';
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  source?: string | null;
  entry_status: ManualLeadStatus;
  property_type?: string | null;
  property_status?: string | null;
  property_label?: string | null;
  price_from?: number | null;
  price_to?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  message?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface CrmInquiry {
  id: string;
  conversation_id: string | null;
  listing_id: string | null;
  buyer_user_id: string;
  recipient_user_id: string;
  agency_user_id?: string | null;
  developer_user_id?: string | null;
  company_user_id?: string | null;
  assigned_agent_user_id?: string | null;
  first_intent?: string | null;
  inquiry_status: string;
  master_lead_status?: string | null;
  created_at: string;
  handoff_note?: string | null;
}

export interface StatusOption {
  value: string;
  label: string;
  shortLabel?: string;
  color?: string;
  bgLight?: string;
  bgDark?: string;
}
