import { AudioPlayer } from 'expo-audio';

export interface ChatAttachmentItem {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'video' | 'document' | 'audio';
}

export interface ChatMessage {
  id: string;
  senderType: 'user' | 'assistant' | 'system' | 'admin';
  senderUserId: string | null;
  authorName: string;
  authorRoleLabel: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  messageKind:
    | 'text'
    | 'system'
    | 'attachments'
    | 'lead'
    | 'embed'
    | 'inquiry_form'
    | 'inquiry_response'
    | 'voice_note'
    | 'listing_card'
    | 'agent_card'
    | 'scheduled_call'
    | 'broadcast';
  body: string;
  sentAt: string;
  readAt?: string | null;
  deliveredAt?: string | null;
  intent: string | null;
  attachments?: ChatAttachmentItem[];
  listingCard?: {
    id: string;
    title: string;
    referenceCode: string | null;
    address: string;
    city: string;
    state: string;
    listingStatus: string | null;
    listingType: string | null;
    imageUrl: string | null;
  } | null;
  inquiryFormCard?: {
    templateId: string;
    title: string;
    description?: string;
    fields: Array<{
      id: string;
      fieldName: string;
      fieldLabel: string;
      fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
      isRequired: boolean;
      options?: string[];
    }>;
  } | null;
  inquiryResponseCard?: {
    templateTitle: string;
    answers: Array<{
      label: string;
      value: string | boolean;
    }>;
  } | null;
  reactions?: Record<string, string[]>;
  structuredPayload?: Record<string, any> | null;
  structured_payload?: Record<string, any> | null;
  voice_note_duration_seconds?: number;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onSendInquiryResponse?: (answers: Record<string, any>) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
  onLongPressMessage?: (message: ChatMessage) => void;
  onReportAgent?: (card?: any) => void;
}

export const formatMsgTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const detectPaymentRequest = (body: string): boolean => {
  if (!body) return false;
  const lower = body.toLowerCase();
  const hasTenDigit = /\b\d{10}\b/.test(body);
  const hasBankTerms = /(account|acct|transfer|bank|zenith|gtb|gtbank|access|uba|first\s*bank|kuda|opay|palmpay|fidelity|stanbic|fcmb|wema|sterling|polaris|union\s*bank|providus|moniepoint)\b/i.test(lower);
  const hasPayPhrases = /(pay to|transfer to|send to account|inspection fee|booking deposit|earnest deposit|commitment fee)\b/i.test(lower);

  return (hasTenDigit && (hasBankTerms || hasPayPhrases)) || (hasPayPhrases && hasBankTerms);
};

export const getStaffTag = (message: ChatMessage): string | null => {
  const isStaffMessage =
    message.senderType === 'admin' ||
    message.authorRoleLabel === 'Agency representative' ||
    message.authorRoleLabel === 'Agency' ||
    message.authorRoleLabel === 'Developer' ||
    message.authorRoleLabel === 'Assigned agent' ||
    message.authorRoleLabel === 'Agent';

  if (!isStaffMessage) return null;
  if (message.authorRoleLabel === 'Agency representative' || message.authorRoleLabel === 'Agency') {
    return 'sent by agency';
  } else if (message.authorRoleLabel === 'Developer') {
    return 'sent by developer';
  } else {
    return `sent by ${message.authorName}`;
  }
};

export const WAVEFORM_BAR_HEIGHTS = [
  8, 14, 20, 12, 18, 24, 16, 22, 28, 14, 10, 18, 24, 14, 20, 26, 12, 18, 22, 16, 12, 20, 14, 10,
];

export type ActiveAudioSession = {
  messageId: string;
  player: AudioPlayer | null;
  pause: () => void;
};

let currentActiveAudioSession: ActiveAudioSession | null = null;
const audioSessionListeners = new Set<(activeMessageId: string | null) => void>();

export const registerAudioPlayback = (session: ActiveAudioSession) => {
  if (currentActiveAudioSession && currentActiveAudioSession.messageId !== session.messageId) {
    try {
      currentActiveAudioSession.pause();
    } catch {}
  }
  currentActiveAudioSession = session;
  audioSessionListeners.forEach((fn) => fn(session.messageId));
};

export const stopAudioPlayback = (messageId: string) => {
  if (currentActiveAudioSession && currentActiveAudioSession.messageId === messageId) {
    currentActiveAudioSession = null;
    audioSessionListeners.forEach((fn) => fn(null));
  }
};

export const subscribeAudioPlayback = (listener: (activeMessageId: string | null) => void) => {
  audioSessionListeners.add(listener);
  return () => {
    audioSessionListeners.delete(listener);
  };
};
