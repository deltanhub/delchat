export interface UseThreadPresenceOptions {
  conversationId: string | null;
  currentUserId: string | null;
  partnerUserId: string | null;
  initialLastSeenAt?: string | null;
  fallbackSubtitle?: string;
}

export interface UseThreadPresenceReturn {
  isPartnerOnline: boolean;
  isPartnerTyping: boolean;
  partnerLastSeenAt: string | null;
  lastSeenText: string;
  sendTyping: (isTyping: boolean) => void;
  clearPartnerTyping: () => void;
  handleComposerTextChange: (text: string) => void;
}
