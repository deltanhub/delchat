export interface ReportReason {
  id: string;
  label: string;
}

export const REPORT_REASONS: ReportReason[] = [
  { id: 'spam', label: 'Spam or Unsolicited Ads' },
  { id: 'scam', label: 'Fraudulent Listing or Scam' },
  { id: 'harassment', label: 'Harassment or Inappropriate Behavior' },
  { id: 'unresponsive', label: 'Misleading Contact Information' },
  { id: 'other', label: 'Other Policy Violation' },
];

export interface ReportModalProps {
  visible: boolean;
  targetName: string;
  agencyName?: string | null;
  isAssignedAgentReport?: boolean;
  onClose: () => void;
  onSubmitReport: (reason: string, details: string, messagesConsent: boolean) => Promise<void>;
}
