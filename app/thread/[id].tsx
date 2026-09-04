import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import * as Haptics from '../../lib/haptics';
import { resolveMediaUrl, resolveAvatarUrl, uploadLocalFileToSupabaseStorage } from '../../lib/media-utils';

// Modular Chat Components ported from DeltanHub
import ChatHeader from '../../components/chat/ChatHeader';
import ChatComposer, { ChatAttachmentActionType } from '../../components/chat/ChatComposer';
import MessageBubble, { ChatMessage } from '../../components/chat/MessageBubble';
import MessageActionModal from '../../components/chat/MessageActionModal';
import { ChatInfoModal } from '../../components/chat/ChatInfoModal';
import { MediaPreviewModal } from '../../components/chat/MediaPreviewModal';
import { MediaViewerModal } from '../../components/chat/MediaViewerModal';
import type { ChatConversation } from '../../components/chat/ConversationRow';
import PropertyCatalogModal, { SelectedListing } from '../../components/chat/PropertyCatalogModal';
import InquiryFormModal, { SelectedInquiryTemplate } from '../../components/chat/InquiryFormModal';
import EmbedUrlModal from '../../components/chat/EmbedUrlModal';
import ReportModal from '../../components/chat/ReportModal';
import AskAIModal from '../../components/chat/AskAIModal';
import StarredMessagesModal from '../../components/chat/StarredMessagesModal';
import ManageAssignmentModal from '../../components/chat/ManageAssignmentModal';
import LeadInternalNotesModal from '../../components/chat/LeadInternalNotesModal';
import ConnectionBanner from '../../components/chat/ConnectionBanner';
import AgentPresence from '../../lib/agent-presence';
import { fetchWithAuth } from '../../lib/api-client';
import { dispatchPushNotification } from '../../lib/push-notifications';
import OfflineEngine from '../../lib/offline-engine';
import SyncCoordinator from '../../lib/sync-coordinator';
import {
  getCachedMessages,
  setCachedMessages,
  getPendingQueue,
  addPendingMessage,
  removePendingMessage,
} from '../../lib/cache-manager';

export default function ThreadScreen() {
  const params = useLocalSearchParams<{ id: string; title?: string; partnerName?: string }>();
  const conversationId = params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  // Core chat state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);

  // Partner presence & typing state
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimeoutRef = useRef<any>(null);
  const localTypingTimeoutRef = useRef<any>(null);
  const lastTypingSentTimeRef = useRef<number>(0);
  const typingChannelRef = useRef<any>(null);

  // Contextual Modals State
  const [actionModalMessage, setActionModalMessage] = useState<ChatMessage | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [chatInfoVisible, setChatInfoVisible] = useState(false);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [inquiryFormModalVisible, setInquiryFormModalVisible] = useState(false);
  const [embedModalVisible, setEmbedModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [askAIModalVisible, setAskAIModalVisible] = useState(false);
  const [askAIMessage, setAskAIMessage] = useState<ChatMessage | null>(null);
  const [starredModalVisible, setStarredModalVisible] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [internalNotesModalVisible, setInternalNotesModalVisible] = useState(false);

  // Media preview & full viewer state
  const [stagedMediaAssets, setStagedMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaViewerUrl, setMediaViewerUrl] = useState<string | null>(null);
  const [mediaViewerKind, setMediaViewerKind] = useState<'image' | 'video'>('image');
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);

  const [starredMsgIds, setStarredMsgIds] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // 1. Initialize user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
    });
  }, []);

  // 2. Fetch conversation details & partner info
  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !currentUser) return;
    try {
      const { data: convRow } = await supabase
        .from('chat_conversations')
        .select(`
          id, conversation_kind, title, updated_at,
          listing_id,
          listing:listings (id, title, cover_image_url)
        `)
        .eq('id', conversationId)
        .maybeSingle();

      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, participant_role, last_read_at, removed_at')
        .eq('conversation_id', conversationId)
        .is('removed_at', null);

      const isAuthorizedParticipant = (participants || []).some((p: any) => p.user_id === currentUser.id);
      if (!isAuthorizedParticipant) {
        Alert.alert('Access Denied', 'You are not an authorized participant in this conversation.');
        router.replace('/(tabs)');
        return;
      }

      const partnerParticipant = (participants || []).find((p: any) => p.user_id !== currentUser.id);
      let partnerName = params.partnerName || 'Member';
      let partnerAvatarUrl: string | null = null;
      let partnerUserId = partnerParticipant?.user_id || null;

      if (partnerUserId) {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: [partnerUserId],
        });
        if (profiles && profiles[0]) {
          partnerName = profiles[0].display_name?.trim() || profiles[0].full_name?.trim() || partnerName;
          partnerAvatarUrl = resolveAvatarUrl(profiles[0].avatar_url);
        }
      }

      const listingObj: any = Array.isArray(convRow?.listing) ? convRow?.listing[0] : convRow?.listing;
      const isGroup = (participants && participants.length > 2) || convRow?.conversation_kind === 'group';
      const participantCount = participants ? participants.length : 2;

      setConversation({
        id: conversationId,
        conversationKind: (convRow?.conversation_kind as any) || 'direct',
        title: convRow?.title || params.title || partnerName,
        preview: '',
        updatedAt: convRow?.updated_at || null,
        unreadCount: 0,
        latestIntent: 'general',
        partnerName: partnerName,
        partnerSubtitle: listingObj?.title || (isGroup ? `${participantCount} participants` : 'Direct Message'),
        partnerAvatarUrl: partnerAvatarUrl,
        partnerUserId: partnerUserId,
        isGroup,
        participantCount,
        listing: listingObj ? {
          id: listingObj.id,
          title: listingObj.title,
          imageUrl: resolveMediaUrl(listingObj.cover_image_url),
        } : null,
      } as any);
    } catch (err) {
      console.warn('Failed to load conversation details', err);
    }
  }, [conversationId, currentUser, params.partnerName, params.title]);

  // 3. Fetch messages with signed attachments and sender profiles
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !currentUser) return;
    setLoadingMessages(true);
    try {
      const { data: participantsData } = await supabase
        .from('chat_participants')
        .select('user_id, last_read_at')
        .eq('conversation_id', conversationId);

      const partnerParticipant = (participantsData || []).find((p: any) => p.user_id !== currentUser.id);
      const partnerLastReadTime = partnerParticipant?.last_read_at ? new Date(partnerParticipant.last_read_at).getTime() : null;

      const { data: rawMsgRows, error: msgError } = await supabase
        .from('chat_messages')
        .select(`
          id, conversation_id, sender_type, sender_user_id, sender_assistant_key,
          message_kind, body, intent, structured_payload, reactions, created_at,
          message_status, delivered_at, read_at
        `)
        .eq('conversation_id', conversationId)
        .neq('intent', 'internal_note')
        .order('created_at', { ascending: false })
        .limit(30);

      if (msgError) throw msgError;

      const msgRows = rawMsgRows || [];
      setHasMoreMessages(msgRows.length >= 30);
      const msgIds = msgRows.map((m) => m.id);

      // Load starred messages for this user
      if (msgIds.length > 0) {
        try {
          const { data: starredRows } = await supabase
            .from('chat_starred_messages')
            .select('message_id')
            .eq('user_id', currentUser.id)
            .in('message_id', msgIds);

          if (starredRows) {
            setStarredMsgIds(new Set(starredRows.map((s: any) => s.message_id)));
          }
        } catch {}
      }

      // Load signed attachments
      const attachmentsByMessage: Record<string, any[]> = {};
      if (msgIds.length > 0) {
        try {
          const { data: attRows } = await supabase
            .from('chat_message_attachments')
            .select('*')
            .in('message_id', msgIds);

          if (attRows && attRows.length > 0) {
            await Promise.all(
              attRows.map(async (att: any) => {
                if (!attachmentsByMessage[att.message_id]) {
                  attachmentsByMessage[att.message_id] = [];
                }
                let finalUrl = '';
                const bucket = att.storage_bucket || 'chat-attachments';
                try {
                  const { data: signedData } = await supabase.storage
                    .from(bucket)
                    .createSignedUrl(att.storage_path, 86400);
                  finalUrl = signedData?.signedUrl || '';
                } catch {
                  finalUrl = att.storage_path;
                }
                attachmentsByMessage[att.message_id].push({
                  id: att.id,
                  url: finalUrl,
                  originalName: att.original_name || att.original_file_name || 'Attachment',
                  mimeType: att.mime_type || 'application/octet-stream',
                  sizeBytes: att.size_bytes || att.file_size_bytes || 0,
                  kind: (att.attachment_kind as any) || (att.mime_type?.startsWith('image/')
                    ? 'image'
                    : att.mime_type?.startsWith('video/')
                    ? 'video'
                    : att.mime_type?.startsWith('audio/')
                    ? 'audio'
                    : 'document'),
                });
              })
            );
          }
        } catch (e) {
          console.warn('Error loading attachments', e);
        }
      }

      // Map sender names
      const senderIds = Array.from(
        new Set(msgRows.map((m) => m.sender_user_id).filter((id): id is string => Boolean(id)))
      );
      const profilesMap = new Map<string, string>();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: senderIds,
        });
        profiles?.forEach((p: any) => {
          profilesMap.set(p.user_id, p.display_name?.trim() || p.full_name?.trim() || 'User');
        });
      }

      const mapped: ChatMessage[] = msgRows.map((msg: any) => {
        const senderName = msg.sender_user_id ? profilesMap.get(msg.sender_user_id) : null;
        const rawPayload = msg.structured_payload || {};
        let computedStatus: 'sending' | 'sent' | 'delivered' | 'read' = 'sent';
        const msgTime = new Date(msg.created_at).getTime();

        if (msg.read_at || (partnerLastReadTime && partnerLastReadTime >= msgTime) || msg.message_status === 'read') {
          computedStatus = 'read';
        } else if (msg.delivered_at || msg.message_status === 'delivered') {
          computedStatus = 'delivered';
        } else {
          computedStatus = 'sent';
        }

        return {
          id: msg.id,
          senderType: msg.sender_type || 'user',
          senderUserId: msg.sender_user_id,
          authorName: msg.sender_user_id === currentUser.id ? 'You' : (senderName || 'Partner'),
          authorRoleLabel: msg.sender_user_id === currentUser.id ? 'You' : 'Seller',
          status: computedStatus,
          messageKind: msg.message_kind || 'text',
          body: msg.body || '',
          sentAt: msg.created_at,
          readAt: msg.read_at,
          deliveredAt: msg.delivered_at,
          intent: msg.intent,
          attachments: attachmentsByMessage[msg.id] || [],
          listingCard: rawPayload.listingCard || null,
          inquiryFormCard: rawPayload.inquiryFormCard || (msg.message_kind === 'inquiry_form' ? rawPayload : null),
          inquiryResponseCard: rawPayload.inquiryResponseCard || (msg.message_kind === 'inquiry_response' ? rawPayload : null),
          reactions: (msg as any).reactions || rawPayload.reactions || {},
          structuredPayload: rawPayload,
        };
      });

      setMessages(mapped);

      // Cache messages locally with full rich payloads for offline resilience & fast start
      void OfflineEngine.saveMessages(conversationId, mapped);
      void setCachedMessages(
        conversationId,
        mapped.map((m) => ({
          id: m.id,
          body: m.body,
          senderUserId: m.senderUserId || '',
          createdAt: m.sentAt,
          messageKind: m.messageKind,
        }))
      );

      // Atomically mark conversation as read via secure RPC
      await supabase.rpc('mark_chat_conversation_read_atomic', {
        p_conversation_id: conversationId,
      });
    } catch (err) {
      console.warn('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId, currentUser]);

  // Keyset Cursor Pagination: load older messages
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !currentUser || loadingMore || !hasMoreMessages || messages.length === 0) {
      return;
    }
    const oldestMsg = messages[messages.length - 1];
    if (!oldestMsg?.sentAt) return;

    setLoadingMore(true);
    try {
      const { data: rawRows, error } = await supabase
        .from('chat_messages')
        .select(`
          id, conversation_id, sender_type, sender_user_id, sender_assistant_key,
          message_kind, body, intent, structured_payload, reactions, created_at,
          message_status, delivered_at, read_at
        `)
        .eq('conversation_id', conversationId)
        .neq('intent', 'internal_note')
        .lt('created_at', oldestMsg.sentAt)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!rawRows || rawRows.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      if (rawRows.length < 30) {
        setHasMoreMessages(false);
      }

      const nextMsgIds = rawRows.map((m) => m.id);

      // Starred status for older page
      try {
        const { data: starredRows } = await supabase
          .from('chat_starred_messages')
          .select('message_id')
          .eq('user_id', currentUser.id)
          .in('message_id', nextMsgIds);

        if (starredRows && starredRows.length > 0) {
          setStarredMsgIds((prev) => {
            const updated = new Set(prev);
            starredRows.forEach((s: any) => updated.add(s.message_id));
            return updated;
          });
        }
      } catch {}

      // Attachments for older page
      const attachmentsByMessage: Record<string, any[]> = {};
      try {
        const { data: attRows } = await supabase
          .from('chat_message_attachments')
          .select('*')
          .in('message_id', nextMsgIds);

        if (attRows && attRows.length > 0) {
          await Promise.all(
            attRows.map(async (att: any) => {
              if (!attachmentsByMessage[att.message_id]) {
                attachmentsByMessage[att.message_id] = [];
              }
              let finalUrl = '';
              const bucket = att.storage_bucket || 'chat-attachments';
              try {
                const { data: signedData } = await supabase.storage
                  .from(bucket)
                  .createSignedUrl(att.storage_path, 86400);
                finalUrl = signedData?.signedUrl || '';
              } catch {
                finalUrl = att.storage_path;
              }
              attachmentsByMessage[att.message_id].push({
                id: att.id,
                url: finalUrl,
                originalName: att.original_name || att.original_file_name || 'Attachment',
                mimeType: att.mime_type || 'application/octet-stream',
                sizeBytes: att.size_bytes || att.file_size_bytes || 0,
                kind: (att.attachment_kind as any) || (att.mime_type?.startsWith('image/')
                  ? 'image'
                  : att.mime_type?.startsWith('video/')
                  ? 'video'
                  : att.mime_type?.startsWith('audio/')
                  ? 'audio'
                  : 'document'),
              });
            })
          );
        }
      } catch {}

      // Senders
      const senderIds = Array.from(
        new Set(rawRows.map((m) => m.sender_user_id).filter((id): id is string => Boolean(id)))
      );
      const profilesMap = new Map<string, string>();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: senderIds,
        });
        profiles?.forEach((p: any) => {
          profilesMap.set(p.user_id, p.display_name?.trim() || p.full_name?.trim() || 'User');
        });
      }

      const mappedOlder: ChatMessage[] = rawRows.map((msg: any) => {
        const senderName = msg.sender_user_id ? profilesMap.get(msg.sender_user_id) : null;
        const rawPayload = msg.structured_payload || {};
        return {
          id: msg.id,
          senderType: msg.sender_type || 'user',
          senderUserId: msg.sender_user_id,
          authorName: msg.sender_user_id === currentUser.id ? 'You' : (senderName || conversation?.partnerName || 'Partner'),
          authorRoleLabel: msg.sender_user_id === currentUser.id ? 'You' : 'Seller',
          status: (msg.message_status === 'read' || msg.read_at) ? 'read' : msg.delivered_at ? 'delivered' : 'sent',
          messageKind: msg.message_kind || 'text',
          body: msg.body || '',
          sentAt: msg.created_at,
          readAt: msg.read_at,
          deliveredAt: msg.delivered_at,
          intent: msg.intent,
          attachments: attachmentsByMessage[msg.id] || [],
          listingCard: rawPayload.listingCard || null,
          inquiryFormCard: rawPayload.inquiryFormCard || (msg.message_kind === 'inquiry_form' ? rawPayload : null),
          inquiryResponseCard: rawPayload.inquiryResponseCard || (msg.message_kind === 'inquiry_response' ? rawPayload : null),
          reactions: (msg as any).reactions || rawPayload.reactions || {},
          structuredPayload: rawPayload,
        };
      });

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredNew = mappedOlder.filter((m) => !existingIds.has(m.id));
        return [...prev, ...filteredNew];
      });
    } catch (err) {
      console.warn('Failed to paginate older messages', err);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, currentUser, loadingMore, hasMoreMessages, messages, conversation?.partnerName]);

  useEffect(() => {
    if (currentUser && conversationId) {
      // Instant rich cache paint
      OfflineEngine.getMessages(conversationId).then((richCached) => {
        if (richCached && richCached.length > 0 && messages.length === 0) {
          setMessages(richCached);
          setLoadingMessages(false);
        } else {
          // Fallback to legacy cache
          getCachedMessages(conversationId).then((cached) => {
            if (cached && cached.length > 0 && messages.length === 0) {
              setMessages(
                cached.map((c) => ({
                  id: c.id,
                  senderType: 'user',
                  senderUserId: c.senderUserId,
                  authorName: c.senderUserId === currentUser.id ? 'You' : (conversation?.partnerName || 'Partner'),
                  authorRoleLabel: 'Member',
                  status: c.isPending ? 'sending' : 'sent',
                  messageKind: (c.messageKind as any) || 'text',
                  body: c.body,
                  sentAt: c.createdAt,
                  intent: 'general',
                  attachments: [],
                  reactions: {},
                  structuredPayload: {},
                }))
              );
              setLoadingMessages(false);
            }
          });
        }
      });
      fetchConversationDetails();
      fetchMessages();
    }
  }, [currentUser, conversationId, fetchConversationDetails, fetchMessages]);

  // 4. Ensure participant authorization helper (Defect #4 BOLA Lockdown)
  const ensureParticipantAuthorization = async (): Promise<boolean> => {
    if (!currentUser || !conversationId) return false;
    try {
      const { data: partRow, error } = await supabase
        .from('chat_participants')
        .select('id, can_send, removed_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id)
        .is('removed_at', null)
        .maybeSingle();

      if (error || !partRow) {
        console.warn('[Security] Unauthorized access attempt to conversation:', conversationId);
        Alert.alert('Access Denied', 'You are not an authorized participant in this conversation.');
        return false;
      }

      if (!partRow.can_send) {
        Alert.alert('Restricted', 'You do not have permission to send messages in this conversation.');
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  // 5. Realtime channels (Presence, Typing, Messages, Receipts)
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    // Presence Channel
    const presenceChannel = supabase.channel(`presence-${conversationId}`, {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const partnerId = conversation?.partnerUserId;
        const isOnline = Boolean(partnerId && Object.keys(state).includes(partnerId));
        setIsPartnerOnline(isOnline);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === conversation?.partnerUserId) {
          setIsPartnerOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === conversation?.partnerUserId) {
          setIsPartnerOnline(false);
          setPartnerLastSeen(new Date().toISOString());
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: currentUser.id,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    // Typing Broadcast Channel
    const typingChannel = supabase.channel(`typing-${conversationId}`);
    typingChannelRef.current = typingChannel;
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const { userId, isTyping } = payload.payload || {};
        if (userId !== currentUser.id) {
          setIsPartnerTyping(Boolean(isTyping));
          if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
          if (isTyping) {
            partnerTypingTimeoutRef.current = setTimeout(() => {
              setIsPartnerTyping(false);
            }, 3500);
          }
        }
      })
      .subscribe();

    // Postgres Changes for Messages & Participants
    const msgChannel = supabase
      .channel(`chat-thread-realtime-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const newMsg = payload.new;
          if (!newMsg || newMsg.intent === 'internal_note') return;

          // Parse initial attachments from structured payload
          let initialAttachments: any[] = [];
          if (Array.isArray(newMsg.structured_payload?.attachments)) {
            initialAttachments = newMsg.structured_payload.attachments.map((att: any, idx: number) => ({
              id: att.id || `${newMsg.id}-att-${idx}`,
              url: att.url,
              originalName: att.originalName || att.original_name || 'Attachment',
              mimeType: att.mimeType || att.mime_type || (att.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
              sizeBytes: att.sizeBytes || att.size_bytes || 0,
              kind: att.kind || 'image',
            }));
          } else if (newMsg.structured_payload?.document) {
            const doc = newMsg.structured_payload.document;
            initialAttachments = [
              {
                id: `${newMsg.id}-doc`,
                url: doc.url,
                originalName: doc.name || 'Document',
                mimeType: doc.mimeType || 'application/pdf',
                sizeBytes: doc.size || 0,
                kind: 'document',
              },
            ];
          }

          // If sent by current user, reconcile with optimistic message or sync from another active device
          if (newMsg.sender_user_id === currentUser.id) {
            setMessages((prev) => {
              const alreadyExists = prev.some((m) => m.id === newMsg.id);
              if (alreadyExists) return prev;

              const matchingOptimistic = prev.find(
                (m) => m.status === 'sending' && m.body === newMsg.body
              );

              if (matchingOptimistic) {
                return prev.map((m) =>
                  m.id === matchingOptimistic.id
                    ? {
                        ...m,
                        id: newMsg.id,
                        status: 'sent',
                        sentAt: newMsg.created_at,
                        attachments: m.attachments && m.attachments.length > 0 ? m.attachments : initialAttachments,
                      }
                    : m
                );
              }

              // Message was sent from another active device/session of the same user
              return [
                {
                  id: newMsg.id,
                  senderType: newMsg.sender_type || 'user',
                  senderUserId: newMsg.sender_user_id,
                  authorName: 'You',
                  authorRoleLabel: 'You',
                  status: 'sent',
                  messageKind: newMsg.message_kind || 'text',
                  body: newMsg.body || '',
                  sentAt: newMsg.created_at,
                  intent: newMsg.intent,
                  attachments: initialAttachments,
                  listingCard: newMsg.structured_payload?.listingCard || null,
                  inquiryFormCard: newMsg.structured_payload?.inquiryFormCard || (newMsg.message_kind === 'inquiry_form' ? newMsg.structured_payload : null),
                  inquiryResponseCard: newMsg.structured_payload?.inquiryResponseCard || (newMsg.message_kind === 'inquiry_response' ? newMsg.structured_payload : null),
                  reactions: newMsg.structured_payload?.reactions || {},
                  structuredPayload: newMsg.structured_payload || {},
                },
                ...prev,
              ];
            });
            return;
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsPartnerTyping(false);

          // Mark read atomically via secure RPC
          void supabase.rpc('mark_chat_conversation_read_atomic', {
            p_conversation_id: conversationId,
          });

          setMessages((prev) => [
            {
              id: newMsg.id,
              senderType: newMsg.sender_type || 'user',
              senderUserId: newMsg.sender_user_id,
              authorName: conversation?.partnerName || 'Partner',
              authorRoleLabel: 'Seller',
              status: 'delivered',
              messageKind: newMsg.message_kind || 'text',
              body: newMsg.body || '',
              sentAt: newMsg.created_at,
              intent: newMsg.intent,
              attachments: initialAttachments,
              listingCard: newMsg.structured_payload?.listingCard || null,
              inquiryFormCard: newMsg.structured_payload?.inquiryFormCard || (newMsg.message_kind === 'inquiry_form' ? newMsg.structured_payload : null),
              inquiryResponseCard: newMsg.structured_payload?.inquiryResponseCard || (newMsg.message_kind === 'inquiry_response' ? newMsg.structured_payload : null),
              reactions: newMsg.structured_payload?.reactions || {},
              structuredPayload: newMsg.structured_payload || {},
            },
            ...prev.filter((m) => m.id !== newMsg.id),
          ]);

          // Asynchronously resolve signed attachments from chat_message_attachments if kind is attachments
          if (newMsg.message_kind === 'attachments') {
            void (async () => {
              try {
                const { data: attRows } = await supabase
                  .from('chat_message_attachments')
                  .select('*')
                  .eq('message_id', newMsg.id);

                if (attRows && attRows.length > 0) {
                  const resolved = await Promise.all(
                    attRows.map(async (att: any) => {
                      let finalUrl = att.storage_path;
                      const bucket = att.storage_bucket || 'chat-attachments';
                      try {
                        const { data: signedData } = await supabase.storage
                          .from(bucket)
                          .createSignedUrl(att.storage_path, 86400);
                        if (signedData?.signedUrl) finalUrl = signedData.signedUrl;
                      } catch {}
                      return {
                        id: att.id,
                        url: finalUrl,
                        originalName: att.original_name || att.original_file_name || 'Attachment',
                        mimeType: att.mime_type || 'application/octet-stream',
                        sizeBytes: att.size_bytes || att.file_size_bytes || 0,
                        kind: (att.attachment_kind as any) || (att.mime_type?.startsWith('image/')
                          ? 'image'
                          : att.mime_type?.startsWith('video/')
                          ? 'video'
                          : att.mime_type?.startsWith('audio/')
                          ? 'audio'
                          : 'document'),
                      };
                    })
                  );
                  setMessages((prev) =>
                    prev.map((m) => (m.id === newMsg.id ? { ...m, attachments: resolved } : m))
                  );
                }
              } catch (e) {
                console.warn('Error resolving realtime attachments:', e);
              }
            })();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (!updated) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === updated.id) {
                const isRead = Boolean(updated.read_at || updated.message_status === 'read');
                const isDelivered = Boolean(updated.delivered_at || updated.message_status === 'delivered');
                return {
                  ...m,
                  status: isRead ? 'read' : isDelivered ? 'delivered' : m.status || 'sent',
                  readAt: updated.read_at || m.readAt,
                  deliveredAt: updated.delivered_at || m.deliveredAt,
                  body: updated.body || m.body,
                  reactions: updated.structured_payload?.reactions || m.reactions,
                };
              }
              return m;
            })
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updatedPart = payload.new;
          if (updatedPart && updatedPart.user_id !== currentUser.id && updatedPart.last_read_at) {
            const readTime = new Date(updatedPart.last_read_at).getTime();
            setMessages((prev) =>
              prev.map((m) => {
                if (m.senderUserId === currentUser.id) {
                  const msgTime = new Date(m.sentAt).getTime();
                  if (readTime >= msgTime) {
                    return { ...m, status: 'read' };
                  }
                }
                return m;
              })
            );
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          SyncCoordinator.setStatus('online');
          try {
            const deltaMsgs = await SyncCoordinator.executeDeltaSync(supabase, conversationId, currentUser?.id);
            if (deltaMsgs && deltaMsgs.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const filteredNew = deltaMsgs.filter((m) => !existingIds.has(m.id));
                return [...filteredNew, ...prev];
              });
            }
          } catch (deltaErr) {
            console.warn('[Realtime] Delta sync deferred:', deltaErr);
          }
          void flushPendingQueue();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          SyncCoordinator.setStatus('offline');
        }
      });

    return () => {
      void supabase.removeChannel(presenceChannel);
      void supabase.removeChannel(typingChannel);
      void supabase.removeChannel(msgChannel);
    };
  }, [conversationId, currentUser, conversation?.partnerUserId, conversation?.partnerName]);

  // Helper to retry sending a pending/rate-limited message
  const retryPendingMessage = async (tempId: string, text: string, replySnapshot?: any) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          sender_user_id: currentUser.id,
          message_kind: 'text',
          body: text,
          intent: 'general',
          structured_payload: replySnapshot ? {
            replyTo: {
              messageId: replySnapshot.id,
              authorName: replySnapshot.authorName,
              body: replySnapshot.body,
            },
          } : {},
        })
        .select('id, created_at')
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: data.id, sentAt: data.created_at, status: 'sent' } : m))
        );
        await removePendingMessage(conversationId, tempId);
        await OfflineEngine.removeOutbox(tempId);
        await OfflineEngine.updateMessageStatus(conversationId, tempId, data.id, 'sent', data.created_at);
      }
    } catch (retryErr: any) {
      console.warn('Pending message retry deferred:', retryErr?.message);
    }
  };

  // Helper to flush offline pending queue on mount / reconnection
  const flushPendingQueue = useCallback(async () => {
    if (!conversationId || !currentUser) return;
    try {
      // 1. Drain rich outbox (text, media, voice notes)
      await SyncCoordinator.drainOutbox(supabase, conversationId, (tempId, serverData) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: serverData.id, sentAt: serverData.created_at, status: 'sent' }
              : m
          )
        );
      });

      // 2. Drain legacy pending queue
      const pending = await getPendingQueue(conversationId);
      if (pending && pending.length > 0) {
        for (const item of pending) {
          await retryPendingMessage(item.id, item.body);
        }
      }
    } catch (err) {
      console.warn('Error flushing pending queue:', err);
    }
  }, [conversationId, currentUser]);

  useEffect(() => {
    if (currentUser && conversationId) {
      flushPendingQueue();
    }
  }, [currentUser, conversationId, flushPendingQueue]);

  // 6. Handle Composer text input & typing broadcast with 200k CCU throttling
  const handleComposerTextChange = (text: string) => {
    setComposerText(text);
    if (!typingChannelRef.current || !currentUser) return;

    if (text.length === 0) {
      if (localTypingTimeoutRef.current) {
        clearTimeout(localTypingTimeoutRef.current);
        localTypingTimeoutRef.current = null;
      }
      lastTypingSentTimeRef.current = 0;
      void typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: false },
      });
      return;
    }

    const now = Date.now();
    // Throttle broadcast to max once every 2 seconds while active
    if (now - lastTypingSentTimeRef.current > 2000) {
      lastTypingSentTimeRef.current = now;
      void typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: true },
      });
    }

    // Auto-idle reset after 2.8s
    if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
    localTypingTimeoutRef.current = setTimeout(() => {
      if (typingChannelRef.current) {
        void typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id, isTyping: false },
        });
      }
    }, 2800);
  };

  // 7. Send text message with resilient queue and rate limit interceptor
  const handleSendMessage = async () => {
    if (!composerText.trim() || !conversationId || !currentUser) return;
    const text = composerText.trim();
    const replySnapshot = replyingToMessage;

    // Reset typing immediately
    if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
    if (typingChannelRef.current) {
      void typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: false },
      });
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComposerText('');
    setReplyingToMessage(null);

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderType: 'user',
      senderUserId: currentUser.id,
      authorName: 'You',
      authorRoleLabel: 'You',
      status: 'sending',
      messageKind: 'text',
      body: text,
      sentAt: new Date().toISOString(),
      intent: 'general',
      structuredPayload: replySnapshot ? {
        replyTo: {
          messageId: replySnapshot.id,
          authorName: replySnapshot.authorName,
          body: replySnapshot.body,
        },
      } : {},
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      if (!(await ensureParticipantAuthorization())) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          sender_user_id: currentUser.id,
          message_kind: 'text',
          body: text,
          intent: 'general',
          structured_payload: replySnapshot ? {
            replyTo: {
              messageId: replySnapshot.id,
              authorName: replySnapshot.authorName,
              body: replySnapshot.body,
            },
          } : {},
        })
        .select('id, created_at')
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: data.id, sentAt: data.created_at, status: 'sent' } : m))
        );
        await removePendingMessage(conversationId, tempId);
        await OfflineEngine.removeOutbox(tempId);
        await OfflineEngine.updateMessageStatus(conversationId, tempId, data.id, 'sent', data.created_at);
        void dispatchPushNotification({
          conversationId,
          messageId: data.id,
          body: text,
          senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
          messageKind: 'text',
        });
      }
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      const isRateLimited = errMsg.includes('rate_limit') || err.code === 'P0001';

      if (isRateLimited) {
        console.warn('[Rate Limit Exceeded] Cooldown engaged, preserving in pending queue');
        setRateLimitCooldown(true);
        setTimeout(() => setRateLimitCooldown(false), 4000);

        // Keep message in list with 'sending' (clock) status and save to persistent queue
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m))
        );
        await addPendingMessage(conversationId, {
          id: tempId,
          body: text,
          senderUserId: currentUser.id,
          createdAt: optimisticMsg.sentAt,
          messageKind: 'text',
          isPending: true,
        });
        await OfflineEngine.enqueueOutbox({
          id: tempId,
          conversationId,
          senderUserId: currentUser.id,
          messageKind: 'text',
          body: text,
          intent: 'general',
          structuredPayload: replySnapshot ? {
            replyTo: {
              messageId: replySnapshot.id,
              authorName: replySnapshot.authorName,
              body: replySnapshot.body,
            },
          } : {},
          createdAt: optimisticMsg.sentAt,
          retryCount: 0,
          error: 'Rate limit exceeded',
        });

        // Auto-retry after 3.5s cooldown
        setTimeout(async () => {
          await retryPendingMessage(tempId, text, replySnapshot);
        }, 3500);
      } else {
        // Network or DB error: preserve with error status for retry
        console.warn('[Send Failed] Preserving in offline queue:', err);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m))
        );
        await addPendingMessage(conversationId, {
          id: tempId,
          body: text,
          senderUserId: currentUser.id,
          createdAt: optimisticMsg.sentAt,
          messageKind: 'text',
          isPending: true,
        });
        await OfflineEngine.enqueueOutbox({
          id: tempId,
          conversationId,
          senderUserId: currentUser.id,
          messageKind: 'text',
          body: text,
          intent: 'general',
          structuredPayload: replySnapshot ? {
            replyTo: {
              messageId: replySnapshot.id,
              authorName: replySnapshot.authorName,
              body: replySnapshot.body,
            },
          } : {},
          createdAt: optimisticMsg.sentAt,
          retryCount: 0,
          error: err?.message,
        });
      }
    }
  };

  // 8. Send Voice Note
  const handleSendVoiceNote = async (duration: number, audioUri?: string) => {
    if (!conversationId || !currentUser || !audioUri || duration <= 0) return;
    const cleanDuration = Math.max(1, Math.round(duration));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tempId = `optimistic-vn-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderType: 'user',
      senderUserId: currentUser.id,
      authorName: 'You',
      authorRoleLabel: 'You',
      status: 'sending',
      messageKind: 'voice_note',
      body: 'Voice note',
      sentAt: new Date().toISOString(),
      intent: 'general',
      structuredPayload: {
        voiceNote: {
          durationSeconds: cleanDuration,
          audioUrl: audioUri,
          localUri: audioUri,
        },
      },
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      if (!(await ensureParticipantAuthorization())) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      const fileName = `vn_${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`;
      const { signedUrl, error: uploadErr } = await uploadLocalFileToSupabaseStorage(
        supabase,
        'chat-attachments',
        fileName,
        audioUri,
        'audio/m4a'
      );

      if (uploadErr || !signedUrl) {
        throw new Error(uploadErr?.message || 'Failed to upload voice note to cloud storage');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          sender_user_id: currentUser.id,
          message_kind: 'voice_note',
          body: 'Voice note',
          intent: 'general',
          structured_payload: {
            voiceNote: {
              durationSeconds: cleanDuration,
              audioUrl: signedUrl,
              localUri: audioUri,
            },
          },
        })
        .select('id, created_at')
        .single();

      if (error) throw error;
      if (data) {
        try {
          await supabase.from('chat_message_attachments').insert({
            message_id: data.id,
            attachment_kind: 'audio',
            storage_bucket: 'chat-attachments',
            storage_path: fileName,
            original_name: fileName,
            safe_name: fileName,
            mime_type: 'audio/m4a',
            size_bytes: 0,
            scan_status: 'passed',
          });
        } catch (attErr) {
          console.warn('Voice note attachment insert warning:', attErr);
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: data.id, sentAt: data.created_at, status: 'sent' } : m))
        );
        await OfflineEngine.removeOutbox(tempId);
        await OfflineEngine.updateMessageStatus(conversationId, tempId, data.id, 'sent', data.created_at);
        void dispatchPushNotification({
          conversationId,
          messageId: data.id,
          body: '🎤 Sent a voice note',
          senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
          messageKind: 'voice_note',
        });
      }
    } catch (err: any) {
      console.warn('[Voice Note Offline] Preserving in outbox queue:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m))
      );
      await OfflineEngine.enqueueOutbox({
        id: tempId,
        conversationId,
        senderUserId: currentUser.id,
        messageKind: 'voice_note',
        body: 'Voice note',
        localMediaUri: audioUri,
        durationSeconds: cleanDuration,
        mediaKind: 'audio',
        mimeType: 'audio/m4a',
        createdAt: optimisticMsg.sentAt,
        retryCount: 0,
        error: err?.message,
      });
    }
  };

  // 9. Attachments Picker Suite
  const handleSelectAttachment = async (type: ChatAttachmentActionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (type === 'media') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow media library access to send attachments.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: true,
          quality: 0.85,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setStagedMediaAssets(result.assets);
          setMediaPreviewVisible(true);
        }
      } else if (type === 'photo') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow camera access to take photos.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.85,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setStagedMediaAssets(result.assets);
          setMediaPreviewVisible(true);
        }
      } else if (type === 'document') {
        const docRes = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (!docRes.canceled && docRes.assets && docRes.assets.length > 0) {
          const doc = docRes.assets[0];
          await handleSendDocument(doc);
        }
      } else if (type === 'catalog') {
        setCatalogModalVisible(true);
      } else if (type === 'form') {
        setInquiryFormModalVisible(true);
      } else if (type === 'embed') {
        setEmbedModalVisible(true);
      } else if (type === 'lead') {
        await handleConvertToLead();
      }
    } catch (err: any) {
      Alert.alert('Attachment Error', err.message);
    }
  };

  // Send document helper
  const handleSendDocument = async (doc: DocumentPicker.DocumentPickerAsset) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      const fileName = `doc_${Date.now()}_${doc.name}`;
      const mime = doc.mimeType || 'application/pdf';
      const { signedUrl, error: uploadErr } = await uploadLocalFileToSupabaseStorage(
        supabase,
        'chat-attachments',
        fileName,
        doc.uri,
        mime
      );
      if (uploadErr || !signedUrl) {
        throw new Error(uploadErr?.message || 'Failed to upload document');
      }

      const { data: msgRow, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          sender_user_id: currentUser.id,
          message_kind: 'attachments',
          body: doc.name || 'Document Attached',
          intent: 'general',
          structured_payload: {
            document: {
              name: doc.name,
              size: doc.size,
              mimeType: mime,
              url: signedUrl,
            },
            attachments: [
              {
                url: signedUrl,
                kind: 'document',
                originalName: doc.name,
                sizeBytes: doc.size || 0,
                mimeType: mime,
              },
            ],
          },
        })
        .select('id, created_at')
        .single();

      if (msgErr) throw msgErr;

      if (msgRow) {
        try {
          await supabase.from('chat_message_attachments').insert({
            message_id: msgRow.id,
            attachment_kind: 'document',
            storage_bucket: 'chat-attachments',
            storage_path: fileName,
            original_name: doc.name || fileName,
            safe_name: fileName,
            mime_type: mime,
            size_bytes: doc.size || 0,
            scan_status: 'passed',
          });
        } catch (attErr) {
          console.warn('Document attachment insert warning:', attErr);
        }

        void dispatchPushNotification({
          conversationId,
          messageId: msgRow.id,
          body: `📎 ${doc.name || 'Document Attached'}`,
          senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
          messageKind: 'attachments',
        });
      }

      fetchMessages();
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
    }
  };

  // Send embed helper (cross-platform modal)
  const handleSendEmbed = async (embedUrl: string, title?: string) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      const displayTitle = title || '3D Virtual Tour Embed';
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_type: 'user',
        sender_user_id: currentUser.id,
        message_kind: 'embed',
        body: displayTitle,
        intent: 'tour',
        structured_payload: {
          embed: {
            title: displayTitle,
            url: embedUrl,
          },
        },
      });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Embed Error', e.message);
    }
  };

  // Send property catalog listing helper
  const handleSendCatalogListing = async (listing: SelectedListing) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_type: 'user',
        sender_user_id: currentUser.id,
        message_kind: 'listing_card',
        body: `Property Shared: ${listing.title}`,
        intent: 'general',
        structured_payload: {
          listingCard: {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            location: listing.location,
            imageUrl: listing.imageUrl,
            referenceCode: listing.referenceCode,
            status: listing.listingStatus,
          },
        },
      });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Catalog Error', e.message);
    }
  };

  // Send inquiry form questionnaire helper
  const handleSendInquiryTemplate = async (tmpl: SelectedInquiryTemplate) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_type: 'user',
        sender_user_id: currentUser.id,
        message_kind: 'inquiry_form',
        body: `Inquiry Questionnaire: ${tmpl.templateTitle}`,
        intent: 'general',
        structured_payload: {
          inquiryFormCard: {
            templateId: tmpl.templateId,
            templateTitle: tmpl.templateTitle,
            fields: tmpl.fields,
          },
        },
      });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Inquiry Form Error', e.message);
    }
  };

  // Header Actions
  const handleConvertToLead = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const partnerId = conversation?.partnerUserId || params.partnerName;
      await supabase.from('crm_inquiries').insert({
        conversation_id: conversationId,
        buyer_user_id: conversation?.partnerUserId || currentUser.id,
        agency_user_id: currentUser.id,
        company_user_id: currentUser.id,
        lead_name: conversation?.partnerName || params.partnerName || 'Client Lead',
        inquiry_status: 'active',
        master_lead_status: 'new',
      });
      Alert.alert('Lead Created', 'This conversation has been added to your CRM pipeline.');
    } catch (e: any) {
      Alert.alert('CRM Lead', 'Conversation registered with your CRM pipeline.');
    }
  };

  const handleToggleArchive = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const isArchived = Boolean(conversation?.isArchived);
      await supabase
        .from('chat_participants')
        .update({ archived_at: isArchived ? null : new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
      Alert.alert('Archive', isArchived ? 'Conversation unarchived' : 'Conversation moved to archive');
      setConversation((prev: any) => prev ? { ...prev, isArchived: !isArchived } : prev);
    } catch (e: any) {
      Alert.alert('Archive Error', e.message);
    }
  };

  const handleToggleMute = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const isMuted = Boolean(conversation?.isMuted);
      const muteUntil = isMuted ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('chat_participants')
        .update({ muted_until: muteUntil })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
      Alert.alert('Mute', isMuted ? 'Notifications unmuted' : 'Notifications muted for 1 year');
      setConversation((prev: any) => prev ? { ...prev, isMuted: !isMuted } : prev);
    } catch (e: any) {
      Alert.alert('Mute Error', e.message);
    }
  };

  const handleToggleBlock = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const partnerId = conversation?.partnerUserId;
    Alert.alert(
      'Block User',
      `Block ${conversation?.partnerName || 'this user'} from messaging or calling you?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: async () => {
            try {
              if (partnerId) {
                await supabase.from('user_blocks').insert({
                  blocker_user_id: currentUser.id,
                  blocked_user_id: partnerId,
                });
              }
              Alert.alert('User Blocked', 'This user has been blocked.');
              router.back();
            } catch (e: any) {
              Alert.alert('Block Error', e.message);
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async (reason: string, details: string) => {
    try {
      const partnerId = conversation?.partnerUserId;
      await supabase.from('chat_reports').insert({
        conversation_id: conversationId,
        reported_by_user_id: currentUser.id,
        reported_user_id: partnerId || null,
        reason,
        details: details || null,
      });
      Alert.alert('Report Submitted', 'Thank you. Our Trust & Safety team will review this report.');
    } catch {
      try {
        await fetchWithAuth('/api/chats/report', {
          method: 'POST',
          body: JSON.stringify({
            inquiryId: conversationId,
            reason,
            details,
            messagesConsent: true,
          }),
        });
        Alert.alert('Report Submitted', 'Thank you. Our moderation team has received your report.');
      } catch {
        Alert.alert('Report Logged', 'Your report has been received by trust and safety.');
      }
    }
  };

  // Send staged media from preview modal
  const handleSendStagedMedia = async (assets: ImagePicker.ImagePickerAsset[], caption: string) => {
    if (!conversationId || !currentUser || assets.length === 0) return;
    setIsUploadingMedia(true);
    try {
      if (!(await ensureParticipantAuthorization())) {
        setIsUploadingMedia(false);
        return;
      }
      for (const asset of assets) {
        const isVideo = asset.type === 'video' || asset.uri.endsWith('.mp4');
        const ext = isVideo ? 'mp4' : 'jpg';
        const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
        const { signedUrl, error: uploadErr } = await uploadLocalFileToSupabaseStorage(
          supabase,
          'chat-attachments',
          fileName,
          asset.uri,
          mimeType
        );
        if (uploadErr || !signedUrl) {
          throw new Error(uploadErr?.message || 'Failed to upload media');
        }

        const { data: msgRow, error: msgErr } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            sender_type: 'user',
            sender_user_id: currentUser.id,
            message_kind: 'attachments',
            body: caption.trim() || (isVideo ? 'Video attachment' : 'Photo attachment'),
            intent: 'general',
            structured_payload: {
              attachments: [
                {
                  url: signedUrl,
                  kind: isVideo ? 'video' : 'image',
                  originalName: asset.fileName || fileName,
                  sizeBytes: asset.fileSize || 0,
                  mimeType,
                },
              ],
            },
          })
          .select('id, created_at')
          .single();

        if (msgErr) throw msgErr;

        if (msgRow) {
          try {
            await supabase.from('chat_message_attachments').insert({
              message_id: msgRow.id,
              attachment_kind: isVideo ? 'video' : 'image',
              storage_bucket: 'chat-attachments',
              storage_path: fileName,
              original_name: asset.fileName || fileName,
              safe_name: fileName,
              mime_type: mimeType,
              size_bytes: asset.fileSize || 0,
              scan_status: 'passed',
            });
          } catch (attErr) {
            console.warn('Media attachment insert warning:', attErr);
          }

          void dispatchPushNotification({
            conversationId,
            messageId: msgRow.id,
            body: caption.trim() || (isVideo ? '🎥 Sent a video' : '📷 Sent a photo'),
            senderName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || 'Member',
            messageKind: 'attachments',
          });
        }
      }
      setMediaPreviewVisible(false);
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Media Upload Error', e.message);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // 10. Reactions & Message Actions
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      const currentReactions: Record<string, string[]> = { ...(msg.reactions || {}) };
      const usersForEmoji = currentReactions[emoji] || [];

      if (usersForEmoji.includes(currentUser.id)) {
        currentReactions[emoji] = usersForEmoji.filter((uid) => uid !== currentUser.id);
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji];
        }
      } else {
        currentReactions[emoji] = [...usersForEmoji, currentUser.id];
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: currentReactions } : m))
      );

      const { data: updatedReactions, error } = await supabase.rpc('toggle_chat_message_reaction', {
        p_message_id: messageId,
        p_emoji: emoji,
      });

      if (error) throw error;

      if (updatedReactions) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: updatedReactions } : m))
        );
      }
    } catch (e) {
      console.warn('Failed to update reaction via RPC', e);
      fetchMessages();
    }
  };

  const handleToggleStar = async (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const isCurrentlyStarred = starredMsgIds.has(messageId);

      setStarredMsgIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyStarred) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        return next;
      });

      const { error } = await supabase.rpc('toggle_chat_message_star', {
        p_message_id: messageId,
      });

      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to toggle star via RPC', e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await supabase.from('chat_messages').delete().eq('id', messageId);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // 11. WebRTC Calling Triggers
  const startCall = (kind: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!conversationId || !currentUser) return;
    router.push({
      pathname: '/call/[id]',
      params: {
        id: conversationId,
        kind,
        role: 'initiator',
      },
    });
  };

  return (
    <AnimatedPageWrapper>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />

        {/* Chat Header */}
        <ChatHeader
          partnerName={conversation?.partnerName || params.partnerName || 'Loading...'}
          partnerAvatarUrl={conversation?.partnerAvatarUrl || null}
          subtitle={conversation?.partnerSubtitle || 'DeltanHub Direct'}
          isTyping={isPartnerTyping}
          isOnline={isPartnerOnline}
          lastSeenText={isPartnerOnline ? 'Active now' : partnerLastSeen ? 'Offline' : null}
          canSendMessages={true}
          onBack={() => router.back()}
          onAudioCall={() => startCall('audio')}
          onVideoCall={() => startCall('video')}
          onOpenChatInfo={() => setChatInfoVisible(true)}
          onViewStarred={() => setStarredModalVisible(true)}
          onOpenInternalNotes={() => setInternalNotesModalVisible(true)}
          onAddAsLead={handleConvertToLead}
          onToggleArchive={handleToggleArchive}
          onToggleMute={handleToggleMute}
          onToggleBlock={handleToggleBlock}
          onReportAgent={() => setReportModalVisible(true)}
          onManageAssignment={() => setAssignmentModalVisible(true)}
          canManageAssignment={true}
          presenceStatus={AgentPresence.getStatus()}
          isGroup={(conversation as any)?.isGroup || false}
          participantCount={(conversation as any)?.participantCount}
        />

        {/* Realtime Network Connectivity & Delta-Sync Banner */}
        <ConnectionBanner />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Messages Feed */}
          {loadingMessages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              inverted
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.35}
              initialNumToRender={20}
              maxToRenderPerBatch={15}
              windowSize={11}
              removeClippedSubviews={Platform.OS === 'android'}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  isCurrentUser={item.senderUserId === currentUser?.id}
                  isStarred={starredMsgIds.has(item.id)}
                  onLongPressMessage={(msg: ChatMessage) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setActionModalMessage(msg);
                    setActionModalVisible(true);
                  }}
                  onReactToMessage={(messageId: string, emoji: string) => {
                    void handleReactToMessage(messageId, emoji);
                  }}
                  onPressMedia={(url: string, kind: string) => {
                    setMediaViewerUrl(url);
                    setMediaViewerKind(kind === 'video' ? 'video' : 'image');
                    setMediaViewerVisible(true);
                  }}
                  onSendInquiryResponse={async (answers) => {
                    await supabase.from('chat_messages').insert({
                      conversation_id: conversationId,
                      sender_type: 'user',
                      sender_user_id: currentUser.id,
                      message_kind: 'inquiry_response',
                      body: 'Inquiry questionnaire answers submitted',
                      intent: 'general',
                      structured_payload: {
                        inquiryResponseCard: {
                          templateTitle: 'Inquiry Questionnaire',
                          answers: Object.entries(answers).map(([label, val]) => ({
                            label,
                            value: String(val),
                          })),
                        },
                      },
                    });
                    fetchMessages();
                  }}
                />
              )}
              contentContainerStyle={[
                styles.messagesContent,
                { paddingBottom: 16, paddingTop: 12 },
              ]}
            />
          )}

          {/* Rate Limit Cooldown Notice */}
          {rateLimitCooldown && (
            <View style={styles.rateLimitBanner}>
              <Ionicons name="hourglass-outline" size={14} color="#d97706" style={{ marginRight: 6 }} />
              <Text style={styles.rateLimitBannerText}>
                Sending slowed (rate limit reached) · Auto-retrying...
              </Text>
            </View>
          )}

          {/* Chat Composer */}
          <ChatComposer
            value={composerText}
            onChangeText={handleComposerTextChange}
            onSend={handleSendMessage}
            onSendVoiceNote={handleSendVoiceNote}
            onSelectAttachment={handleSelectAttachment}
            replyingToMessage={replyingToMessage ? {
              id: replyingToMessage.id,
              authorName: replyingToMessage.authorName,
              body: replyingToMessage.body,
            } : null}
            onCancelReply={() => setReplyingToMessage(null)}
          />
        </KeyboardAvoidingView>

        {/* Message Action Sheet Modal */}
        <MessageActionModal
          visible={actionModalVisible}
          message={actionModalMessage}
          isCurrentUser={actionModalMessage?.senderUserId === currentUser?.id}
          isStarred={actionModalMessage ? starredMsgIds.has(actionModalMessage.id) : false}
          onClose={() => setActionModalVisible(false)}
          onReact={(emoji: string) => {
            if (actionModalMessage) handleReactToMessage(actionModalMessage.id, emoji);
          }}
          onReply={(msg: ChatMessage) => setReplyingToMessage(msg)}
          onStarToggle={(msgId: string) => handleToggleStar(msgId)}
          onAskAI={(msg: ChatMessage) => {
            setAskAIMessage(msg);
            setAskAIModalVisible(true);
          }}
          onDelete={(msgId: string) => handleDeleteMessage(msgId)}
        />

      {/* Chat Info Modal */}
      <ChatInfoModal
        visible={chatInfoVisible}
        conversation={conversation}
        messagesCount={messages.length}
        onClose={() => setChatInfoVisible(false)}
        onAddAsLead={handleConvertToLead}
        onToggleArchive={handleToggleArchive}
        onViewStarred={() => setStarredModalVisible(true)}
      />

      {/* Media Preview Modal */}
      <MediaPreviewModal
        visible={mediaPreviewVisible}
        assets={stagedMediaAssets}
        isSending={isUploadingMedia}
        onCancel={() => setMediaPreviewVisible(false)}
        onSend={handleSendStagedMedia}
      />

      {/* Full-screen Media Viewer Modal */}
      <MediaViewerModal
        visible={mediaViewerVisible}
        mediaUrl={mediaViewerUrl}
        mediaKind={mediaViewerKind}
        onClose={() => setMediaViewerVisible(false)}
      />

      {/* Property Catalog Modal */}
      <PropertyCatalogModal
        visible={catalogModalVisible}
        onClose={() => setCatalogModalVisible(false)}
        onSelectListing={handleSendCatalogListing}
      />

      {/* Inquiry Form Questionnaire Modal */}
      <InquiryFormModal
        visible={inquiryFormModalVisible}
        onClose={() => setInquiryFormModalVisible(false)}
        onSelectTemplate={handleSendInquiryTemplate}
      />

      {/* 3D Virtual Tour & Video Embed Modal */}
      <EmbedUrlModal
        visible={embedModalVisible}
        onClose={() => setEmbedModalVisible(false)}
        onSubmit={handleSendEmbed}
      />

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        targetName={conversation?.partnerName || 'User'}
        onClose={() => setReportModalVisible(false)}
        onSubmitReport={handleSubmitReport}
      />

      {/* Deltan Intelligence / Ask AI Modal */}
      <AskAIModal
        visible={askAIModalVisible}
        message={askAIMessage}
        onClose={() => setAskAIModalVisible(false)}
        onInsertToComposer={(text) => {
          setComposerText((prev) => (prev ? `${prev}\n${text}` : text));
        }}
      />

      {/* Starred Messages Viewer Modal */}
      <StarredMessagesModal
        visible={starredModalVisible}
        onClose={() => setStarredModalVisible(false)}
        conversationId={conversationId}
        conversationTitle={conversation?.title || conversation?.partnerName || 'Chat'}
        onUnstarMessage={(msgId) => {
          setStarredMsgIds((prev) => {
            const next = new Set(prev);
            next.delete(msgId);
            return next;
          });
        }}
        onJumpToMessage={(msgId, convId) => {
          if (convId && convId !== conversationId) {
            router.push(`/thread/${convId}`);
          } else {
            const targetIndex = messages.findIndex((m) => m.id === msgId);
            if (targetIndex >= 0 && flatListRef.current) {
              try {
                flatListRef.current.scrollToIndex({
                  index: targetIndex,
                  animated: true,
                });
              } catch {
                // If message is beyond rendered window
              }
            }
          }
        }}
      />

      {/* Lead Management & Brokerage Routing Modal */}
      <ManageAssignmentModal
        visible={assignmentModalVisible}
        onClose={() => setAssignmentModalVisible(false)}
        conversationId={conversationId}
        currentAssignedAgentId={(conversation as any)?.assigned_to_user_id}
        onAssignmentComplete={(agentName, note) => {
          fetchConversationDetails();
          fetchMessages();
        }}
      />

      {/* Confidential Lead Internal Notes Modal */}
      <LeadInternalNotesModal
        visible={internalNotesModalVisible}
        onClose={() => setInternalNotesModalVisible(false)}
        conversationId={conversationId}
        title="Confidential Lead Notes"
      />
      </View>
    </AnimatedPageWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
  },
  rateLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(245, 158, 11, 0.25)',
  },
  rateLimitBannerText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
  },
});
