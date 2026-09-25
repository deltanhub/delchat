export interface PipelineStageMeta {
  value: string;
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
}

export const STATUS_PIPELINE: PipelineStageMeta[] = [
  { value: 'new', label: 'New Lead', color: '#3b82f6', bgLight: '#eff6ff', bgDark: '#1e293b' },
  { value: 'assigned', label: 'Assigned', color: '#8b5cf6', bgLight: '#f5f3ff', bgDark: '#2e1065' },
  { value: 'contacted', label: 'Contacted', color: '#06b6d4', bgLight: '#ecfeff', bgDark: '#083344' },
  { value: 'qualified', label: 'Qualified', color: '#10b981', bgLight: '#ecfdf5', bgDark: '#064e3b' },
  { value: 'tour_scheduled', label: 'Tour Scheduled', color: '#f59e0b', bgLight: '#fffbeb', bgDark: '#451a03' },
  { value: 'negotiating', label: 'Negotiating', color: '#ec4899', bgLight: '#fdf2f8', bgDark: '#500724' },
  { value: 'closed_won', label: 'Closed Won', color: '#059669', bgLight: '#d1fae5', bgDark: '#064e3b' },
  { value: 'closed_lost', label: 'Closed Lost', color: '#64748b', bgLight: '#f1f5f9', bgDark: '#1e293b' },
  { value: 'spam', label: 'Spam / Invalid', color: '#ef4444', bgLight: '#fef2f2', bgDark: '#450a0a' },
];
