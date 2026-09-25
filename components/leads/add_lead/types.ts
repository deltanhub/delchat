import type { ManualLeadItem } from '../types';

export interface AddManualLeadFormData {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: string;
  status: ManualLeadItem['status'];
  propertyType: string;
  propertyStatus: string;
  priceFrom: string;
  priceTo: string;
  bedrooms: string;
  bathrooms: string;
  message: string;
}

export interface AddManualLeadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (leadData: AddManualLeadFormData) => Promise<boolean>;
  isSubmitting: boolean;
}
