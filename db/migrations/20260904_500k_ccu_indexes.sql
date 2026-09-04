-- ==============================================================================
-- DELCHAT 500k CCU ENTERPRISE GO-LIVE: DATABASE HARDENING & COMPOSITE INDEXES
-- Migration: 20260904_500k_ccu_indexes.sql
-- Target: Supabase PostgreSQL (Port 6543 / 5432)
-- Architecture: Zero-Downtime Non-Blocking Concurrent B-Tree Index Generation
-- ==============================================================================
--
-- OPERATIONAL DEPLOYMENT INSTRUCTIONS:
-- 1. Run in Supabase SQL Editor or via psql CLI.
-- 2. IMPORTANT: Do NOT wrap in a BEGIN ... COMMIT transaction block.
--    PostgreSQL requires 'CREATE INDEX CONCURRENTLY' to execute outside of transactions.
-- 3. In the event of a partial build failure, inspect pg_stat_activity and drop
--    any INVALID index before re-running.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CHAT MESSAGES: High-Frequency Inbox & Thread Keyset Pagination
-- Query Path:
--   SELECT ... FROM chat_messages
--   WHERE conversation_id = $1 AND intent != 'internal_note'
--   ORDER BY created_at DESC LIMIT $2;
-- Impact at 500k CCU: Eliminates full-table sequential scans across millions of rows.
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_conv_created_desc
ON public.chat_messages (conversation_id, created_at DESC)
WHERE intent != 'internal_note';

-- ------------------------------------------------------------------------------
-- 2. CHAT PARTICIPANTS: Active User Inbox Conversations & BOLA Auth Checks
-- Query Path:
--   SELECT conversation_id, pinned_at, is_muted FROM chat_participants
--   WHERE user_id = $1 AND removed_at IS NULL
--   ORDER BY pinned_at DESC NULLS LAST;
-- Impact at 500k CCU: Accelerates inbox conversation resolution and ensureParticipantAuthorization.
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_user_conv_active
ON public.chat_participants (user_id, conversation_id, pinned_at DESC NULLS LAST)
WHERE removed_at IS NULL;

-- ------------------------------------------------------------------------------
-- 3. CHAT CALL PARTICIPANTS: Targeted VoIP Incoming Call HUD Listeners
-- Query Path:
--   SELECT ... FROM chat_call_participants
--   WHERE user_id = $1
--   ORDER BY joined_at DESC;
-- Impact at 500k CCU: Sub-millisecond lookup for incoming calls targeting the authenticated user.
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_call_participants_user_active
ON public.chat_call_participants (user_id, call_id, joined_at DESC);

-- ------------------------------------------------------------------------------
-- 4. CHAT CALL SESSIONS: Active Conversation Call Detection
-- Query Path:
--   SELECT * FROM chat_call_sessions
--   WHERE conversation_id = $1 AND call_status IN ('ringing', 'accepted')
--   ORDER BY started_at DESC LIMIT 1;
-- Impact at 500k CCU: Single-scan index seek when opening a thread with an active call.
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_call_sessions_conv_active
ON public.chat_call_sessions (conversation_id, started_at DESC)
WHERE call_status IN ('ringing', 'accepted');

-- ------------------------------------------------------------------------------
-- 5. CHAT MESSAGE ATTACHMENTS: Bulk Message Attachment Resolution
-- Query Path:
--   SELECT * FROM chat_message_attachments
--   WHERE message_id IN (...)
--   ORDER BY created_at ASC;
-- Impact at 500k CCU: Zero sequential scans during multi-message media batching.
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_message_attachments_msg_kind
ON public.chat_message_attachments (message_id, attachment_kind);

-- ------------------------------------------------------------------------------
-- 6. USER DEVICE TOKENS: Push Notification Multi-Device Fan-Out
-- Query Path:
--   SELECT push_token, platform FROM user_device_tokens
--   WHERE user_id = $1
--   ORDER BY updated_at DESC;
-- Impact at 500k CCU: High-throughput push notification dispatch to active devices.
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_device_tokens_user_updated
ON public.user_device_tokens (user_id, updated_at DESC);

-- ------------------------------------------------------------------------------
-- 7. REFRESH PLANNER STATISTICS
-- Run ANALYZE on all 6 tables so the query planner uses the new indexes immediately.
-- ------------------------------------------------------------------------------
ANALYZE public.chat_messages;
ANALYZE public.chat_participants;
ANALYZE public.chat_call_participants;
ANALYZE public.chat_call_sessions;
ANALYZE public.chat_message_attachments;
ANALYZE public.user_device_tokens;
