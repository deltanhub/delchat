import {
  ChatCallMode,
  ChatCallStatus,
  ChatCallDirection,
  ChatCallPeer,
  ChatCallLog,
  GroupedChatCallLog,
  RecordCallLogParams,
  fetchCallLogs,
  recordCallLogFallback,
  groupCallLogs,
  formatCallTime,
  createCallSession,
  fetchActiveCallSession,
  broadcastIncomingCallNotification,
  updateCallSession,
  updateParticipantStatus,
} from './call';

export * from './call';

/**
 * Domain Call Repository
 * Encapsulates call log fetching, real-time synchronization, grouping, and fallback logging.
 * Mirrors DeltanHub web lib/chat-calls.ts and app/chats/chats-workspace.tsx 1:1.
 *
 * Contract & Audit Invariants:
 * - DeltanHub web call logs endpoint: /api/chats/calls/logs
 * - Deduplication via supabase.getChannels() and cleanup via supabase.removeChannel
 * - Outgoing calls dispatch VoIP background notification via dispatchVoipCallPush
 */
export const callRepository = {
  fetchCallLogs,
  recordCallLogFallback,
  groupCallLogs,
  formatCallTime,
  createCallSession,
  fetchActiveCallSession,
  broadcastIncomingCallNotification,
  updateCallSession,
  updateParticipantStatus,
};
