export type SyncStatus = 'online' | 'offline' | 'syncing';

export interface InboxAlertParams {
  recipientUserId?: string | null;
  conversationId: string;
  senderUserId?: string | null;
}
