export interface LeadDraft {
  fullName: string;
  email: string;
  phone: string;
  note: string;
}

export interface LeadCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: LeadDraft) => Promise<void>;
  initialFullName?: string;
  initialEmail?: string;
  initialPhone?: string;
}

export interface LeadCaptureHeaderProps {
  isDark: boolean;
  onClose: () => void;
}

export interface LeadCaptureFormFieldsProps {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  errorMessage: string | null;
  setErrorMessage: (val: string | null) => void;
  isDark: boolean;
}

export interface LeadCaptureActionsProps {
  isSubmitting: boolean;
  isDark: boolean;
  onClose: () => void;
  onSubmit: () => void;
}
