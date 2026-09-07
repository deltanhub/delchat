import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import * as Haptics from '../../lib/haptics';
import { canAssignAgents } from '../../lib/auth';

// Modular Chat UI Components ported from DeltanHub
import ChatHeader from '../../components/chat/ChatHeader';
import ChatComposer, { ChatAttachmentActionType } from '../../components/chat/ChatComposer';
import MessageBubble, { ChatMessage } from '../../components/chat/MessageBubble';
import MessageActionModal from '../../components/chat/MessageActionModal';
import { ChatInfoModal } from '../../components/chat/ChatInfoModal';
import { MediaPreviewModal } from '../../components/chat/MediaPreviewModal';
import { MediaViewerModal } from '../../components/chat/MediaViewerModal';
import PropertyCatalogModal from '../../components/chat/PropertyCatalogModal';
import InquiryFormModal from '../../components/chat/InquiryFormModal';
import EmbedUrlModal from '../../components/chat/EmbedUrlModal';
import ReportModal from '../../components/chat/ReportModal';
import AskAIModal from '../../components/chat/AskAIModal';
import StarredMessagesModal from '../../components/chat/StarredMessagesModal';
import ManageAssignmentModal from '../../components/chat/ManageAssignmentModal';
import LeadInternalNotesModal from '../../components/chat/LeadInternalNotesModal';
import LeadCaptureModal from '../../components/chat/LeadCaptureModal';
import ConnectionBanner from '../../components/chat/ConnectionBanner';
import ChatToast from '../../components/chat/ChatToast';
import ChatListingBanner from '../../components/chat/ChatListingBanner';
import MasterLeadSubHeader, { MasterLeadSubTab } from '../../components/chat/crm/MasterLeadSubHeader';
import MasterLeadDetailsView from '../../components/chat/crm/MasterLeadDetailsView';

// Domain Hooks (Clean Architecture)
import { useThreadPresence } from '../../hooks/useThreadPresence';
import { useThreadModals } from '../../hooks/thread/useThreadModals';
import { useThreadSession } from '../../hooks/thread/useThreadSession';
import { useThreadMedia } from '../../hooks/thread/useThreadMedia';
import { useThreadMessages } from '../../hooks/thread/useThreadMessages';

/**
 * Lead Management Pipeline Stages
 */
const STATUS_PIPELINE = [
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

/**
 * ThreadScreen — Clean Architecture Presentation Layer
 * Slim dispatcher orchestrating domain hooks and rendering edge-to-edge chat UI.
 *
 * Security & Anti-Spaghetti Architectural Invariants:
 * 1. BOLA Authorization: Verified via `useThreadSession.ensureParticipantAuthorization()` which validates `can_send`.
 * 2. IDOR Protection: Bounces uninvited non-participants via `isAuthorizedParticipant` with `router.replace('/(tabs)')`.
 * 3. Broker Isolation: Internal notes filtered via `intent !== 'internal_note'` and `.neq('intent', 'internal_note')`.
 * 4. Zero Direct Client Inserts: No direct client insertion into `chat_participants`.
 * 5. Media Pipeline: Delegated to `useThreadMedia` inserting into `chat_message_attachments` (e.g. `from('chat_message_attachments').insert`) with cloud storage upload via `uploadLocalFileToSupabaseStorage`.
 */
export default function ThreadScreen() {
  const params = useLocalSearchParams<{ id: string; title?: string; partnerName?: string; partnerSubtitle?: string }>();
  const conversationId = params.id;
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const [masterLeadSubTab, setMasterLeadSubTab] = useState<MasterLeadSubTab>('feed');

  // 1. Modals state machine (12 boolean flags replaced with discriminated union)
  const modals = useThreadModals();

  const initialSubtitle =
    (params.partnerSubtitle as string) ||
    (params.title as string) ||
    '';

  // 2. Session, BOLA authorization, profile identity & lead management
  const session = useThreadSession({
    conversationId,
    partnerNameParam: params.partnerName,
    titleParam: params.title,
    partnerSubtitleParam: initialSubtitle,
  });

  const effectiveSubtitle =
    session.conversation?.listing?.title ||
    session.conversation?.partnerSubtitle ||
    initialSubtitle ||
    'DeltanHub Direct';

  // 3. Realtime presence & typing synchronization
  const {
    isPartnerOnline,
    isPartnerTyping,
    lastSeenText,
    sendTyping,
    clearPartnerTyping,
    handleComposerTextChange,
  } = useThreadPresence({
    conversationId: conversationId || null,
    currentUserId: session.currentUser?.id || null,
    partnerUserId: session.conversation?.partnerUserId || null,
    initialLastSeenAt: session.conversation?.partnerLastSeenAt || null,
    fallbackSubtitle: effectiveSubtitle,
  });

  // 4. Messages lifecycle, keyset pagination, CDC realtime & reactions
  const messages = useThreadMessages({
    conversationId,
    currentUser: session.currentUser,
    partnerName: session.conversation?.partnerName || params.partnerName,
    partnerUserId: session.conversation?.partnerUserId || null,
    ensureParticipantAuthorization: session.ensureParticipantAuthorization,
    clearPartnerTyping,
    sendTyping,
  });

  // 5. Media attachments & voice notes pipeline
  const media = useThreadMedia({
    conversationId,
    currentUser: session.currentUser,
    partnerUserId: session.conversation?.partnerUserId || null,
    ensureParticipantAuthorization: session.ensureParticipantAuthorization,
    onMediaSent: messages.fetchMessages,
    onAddOptimisticMessage: messages.addOptimisticMessage,
    onUpdateOptimisticMessage: messages.updateOptimisticMessage,
    onRemoveOptimisticMessage: messages.removeOptimisticMessage,
  });

  // Agent–Buyer Privacy Guard: Firm oversight only sees pre-delegation history unless sharing is enabled
  const isCompanyViewer = canAssignAgents(session.currentProfile?.mainRole);
  const isLeadAssigned = Boolean(
    session.conversation?.assignment?.assignedAgentUserId ||
    session.conversation?.assignment?.agent
  );
  const isPrivateAgentChat =
    isCompanyViewer &&
    isLeadAssigned &&
    session.conversation?.assignment?.agentShareEnabled === false;

  const displayMessages = useMemo(() => {
    if (!isPrivateAgentChat) return messages.messages;
    const assignedAtTime = session.conversation?.assignment?.assignedAt
      ? new Date(session.conversation.assignment.assignedAt).getTime()
      : null;
    if (!assignedAtTime) return [];
    return messages.messages.filter((m) => new Date(m.sentAt).getTime() <= assignedAtTime);
  }, [messages.messages, isPrivateAgentChat, session.conversation?.assignment?.assignedAt]);

  // WebRTC Calling Launchers
  const startCall = useCallback(
    (kind: 'audio' | 'video') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!conversationId || !session.currentUser) return;
      router.push({
        pathname: '/call/[id]',
        params: {
          id: conversationId,
          kind,
          role: 'initiator',
        },
      });
    },
    [conversationId, session.currentUser, router]
  );

  // Attachment Sheet Dispatcher
  const handleSelectAttachment = useCallback(
    async (type: ChatAttachmentActionType) => {
      switch (type) {
        case 'media':
          await media.handlePickMedia();
          break;
        case 'photo':
          await media.handleLaunchCamera();
          break;
        case 'document':
          await media.handlePickDocument();
          break;
        case 'catalog':
          modals.openModal('catalog');
          break;
        case 'form':
          modals.openModal('inquiry_form');
          break;
        case 'embed':
          modals.openModal('embed');
          break;
        case 'lead':
          await session.handleConvertToLead();
          break;
        case 'assign-agent':
          modals.openModal('assignment');
          break;
      }
    },
    [media, modals, session]
  );

  return (
    <AnimatedPageWrapper>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Chat Header */}
        <ChatHeader
          partnerName={session.conversation?.partnerName || params.partnerName || 'Loading...'}
          partnerAvatarUrl={session.conversation?.partnerAvatarUrl || null}
          subtitle={effectiveSubtitle}
          isTyping={isPartnerTyping}
          isOnline={isPartnerOnline}
          lastSeenText={lastSeenText}
          canSendMessages={!session.conversation?.isBlocked}
          isArchived={Boolean(session.conversation?.isArchived)}
          isMuted={Boolean(session.conversation?.isMuted)}
          isBlocked={Boolean(session.conversation?.isBlocked)}
          onBack={() => router.back()}
          onAudioCall={() => startCall('audio')}
          onVideoCall={() => startCall('video')}
          onOpenChatInfo={() => modals.openModal('chat_info')}
          onViewStarred={() => modals.openModal('starred')}
          onOpenInternalNotes={() => modals.openModal('internal_notes')}
          onAddAsLead={() => modals.openModal('lead_capture')}
          onToggleArchive={session.handleToggleArchive}
          onToggleMute={session.handleToggleMute}
          onToggleBlock={session.handleToggleBlock}
          onReportAgent={() => modals.openModal('report')}
          onManageAssignment={() => modals.openModal('assignment')}
          canManageAssignment={Boolean(session.conversation?.canAssignAgents)}
          hasAssignment={Boolean(session.conversation?.assignment)}
          isGroup={session.conversation?.isGroup || false}
          participantCount={session.conversation?.participantCount}
        />

        {/* In-App Non-Blocking Feedback Toast */}
        <ChatToast message={session.toastMessage} onDismiss={session.dismissToast} />

        {/* Realtime Network Connectivity & Delta-Sync Banner */}
        <ConnectionBanner />

        {/* Linked Listing Context Card (DeltanHub Web Parity: chats-workspace.tsx:L4538) */}
        {session.conversation?.listing ? (
          <ChatListingBanner listing={session.conversation.listing} />
        ) : null}

        {/* Master Lead Workspace SubHeader for Agencies & Developers */}
        {session.conversation?.canAssignAgents && session.conversation?.assignment ? (
          <MasterLeadSubHeader
            conversation={session.conversation}
            activeSubTab={masterLeadSubTab}
            onChangeSubTab={setMasterLeadSubTab}
            onPressStatus={() => modals.openModal('lead_status')}
            onPressAgent={() => modals.openModal('assignment')}
            notesCount={session.notesCount}
            reportsCount={session.reportsCount}
          />
        ) : session.conversation?.assignment && session.conversation.assignment.assignedAgentUserId === session.currentUser?.id ? (
          /* Assigned Lead Strip for Assigned Agent */
          <View
            style={[
              styles.leadStripContainer,
              { backgroundColor: colors.card, borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.leadStripTop}>
              {/* Quick Pipeline Status Pill */}
              {(() => {
                const currentAssignmentStatus = session.conversation.assignment.status;
                const normStatus =
                  currentAssignmentStatus === 'closed'
                    ? 'closed_won'
                    : currentAssignmentStatus === 'lost'
                    ? 'closed_lost'
                    : currentAssignmentStatus;
                const statusMeta =
                  STATUS_PIPELINE.find((s) => s.value === normStatus) || STATUS_PIPELINE[0];
                return (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      modals.openModal('lead_status');
                    }}
                    style={[
                      styles.leadStripStatusBadge,
                      { backgroundColor: isDark ? statusMeta.bgDark : statusMeta.bgLight },
                    ]}
                  >
                    <View style={[styles.leadStripStatusDot, { backgroundColor: statusMeta.color }]} />
                    <Text style={[styles.leadStripStatusText, { color: statusMeta.color }]}>
                      ASSIGNED LEAD: {statusMeta.label.toUpperCase()}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={11}
                      color={statusMeta.color}
                      style={{ marginLeft: 3 }}
                    />
                  </TouchableOpacity>
                );
              })()}

              <View style={styles.leadStripActions}>
                <View
                  style={[
                    styles.leadStripPillBtn,
                    { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color="#10b981"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.leadStripPillText, { color: '#10b981', fontWeight: '700' }]}>
                    Assigned to You
                  </Text>
                </View>

                {/* Confidential Lead Notes Button */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    modals.openModal('internal_notes');
                  }}
                  style={[
                    styles.leadStripIconBtn,
                    { backgroundColor: isDark ? '#262626' : '#f1f5f9' },
                  ]}
                  accessibilityLabel="Confidential internal notes"
                >
                  <Ionicons name="lock-closed-outline" size={14} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Assigned Agent Share Control Row */}
            <TouchableOpacity
              onPress={session.handleToggleInThreadAgentShare}
              style={[
                styles.leadStripShareBanner,
                {
                  backgroundColor: session.conversation.assignment.agentShareEnabled
                    ? isDark
                      ? '#064e3b'
                      : '#ecfdf5'
                    : isDark
                    ? '#1f2937'
                    : '#f8fafc',
                  borderColor: session.conversation.assignment.agentShareEnabled
                    ? '#10b981'
                    : colors.border,
                },
              ]}
            >
              <Ionicons
                name={session.conversation.assignment.agentShareEnabled ? 'eye' : 'eye-off'}
                size={13}
                color={
                  session.conversation.assignment.agentShareEnabled
                    ? '#10b981'
                    : colors.placeholder
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.leadStripShareText,
                  {
                    color: session.conversation.assignment.agentShareEnabled
                      ? '#10b981'
                      : colors.placeholder,
                  },
                ]}
              >
                {session.conversation.assignment.agentShareEnabled
                  ? 'Thread shared with Agency Principal'
                  : 'Private thread (Tap to share with Agency)'}
              </Text>
            </TouchableOpacity>

            {/* Manager Handoff Note Box */}
            {session.conversation.assignment.handoffNote ? (
              <View
                style={[
                  styles.leadStripHandoffBox,
                  {
                    backgroundColor: isDark ? '#261a0f' : '#fffbeb',
                    borderColor: isDark ? '#78350f' : '#fde68a',
                  },
                ]}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={13}
                  color="#d97706"
                  style={{ marginRight: 6, marginTop: 1 }}
                />
                <Text
                  style={[styles.leadStripHandoffText, { color: isDark ? '#fde68a' : '#92400e' }]}
                  numberOfLines={2}
                >
                  <Text style={{ fontWeight: '700' }}>Handoff: </Text>
                  {session.conversation.assignment.handoffNote}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Master Lead Workspace Sub-View or Live Chat Feed */}
        {masterLeadSubTab !== 'feed' && session.conversation && canAssignAgents(session.currentProfile?.mainRole) ? (
          <MasterLeadDetailsView
            conversation={session.conversation}
            messages={messages.messages}
            activeSubTab={masterLeadSubTab}
            onOpenInternalNotes={() => modals.openModal('internal_notes')}
            onNotesCountChange={() => {
              if (session.conversation?.assignment?.leadId) {
                session.fetchInquiryCounts(session.conversation.assignment.leadId);
              }
            }}
            onReportsCountChange={() => {
              if (session.conversation?.assignment?.leadId) {
                session.fetchInquiryCounts(session.conversation.assignment.leadId);
              }
            }}
          />
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            {/* Messages Feed — WhatsApp Local-First 0ms Instant Rendering */}
            {messages.loadingMessages && messages.messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : isPrivateAgentChat && displayMessages.length === 0 ? (
              <View style={styles.privacyNoticeContainer}>
                <View
                  style={[
                    styles.privacyNoticeCard,
                    {
                      backgroundColor: isDark ? '#261219' : '#fdf6f8',
                      borderColor: isDark ? '#4a0f1f' : '#efe3e8',
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={28}
                    color={isDark ? '#f4a5b8' : '#4a0f1f'}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={[styles.privacyNoticeTitle, { color: colors.text }]}>
                    📍 This listing was assigned to agent{' '}
                    {session.conversation?.assignment?.assignedAgentName ||
                      session.conversation?.assignment?.agent?.fullName ||
                      'the agent'}{' '}
                    from creation.
                  </Text>
                  <Text style={[styles.privacyNoticeSubtitle, { color: colors.placeholder }]}>
                    Messages exchanged between the buyer and the agent are private by default.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setMasterLeadSubTab('details')}
                    style={[styles.privacyNoticeBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.privacyNoticeBtnText}>Go to Lead Details →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={displayMessages}
                keyExtractor={(item) => item.id}
                inverted
                onEndReached={messages.loadMoreMessages}
                onEndReachedThreshold={0.35}
                initialNumToRender={20}
                maxToRenderPerBatch={15}
                windowSize={11}
                removeClippedSubviews={Platform.OS === 'android'}
                ListHeaderComponent={
                  isPrivateAgentChat ? (
                    <View
                      style={[
                        styles.delegationNoticeCard,
                        {
                          backgroundColor: isDark ? '#1f1f23' : '#ffffff',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.delegationNoticeText, { color: colors.placeholder }]}>
                        📍 Lead was delegated to agent{' '}
                        {session.conversation?.assignment?.assignedAgentName ||
                          session.conversation?.assignment?.agent?.fullName ||
                          'the agent'}
                        {session.conversation?.assignment?.assignedAt
                          ? ` on ${new Date(session.conversation.assignment.assignedAt).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}`
                          : ''}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setMasterLeadSubTab('details')}
                        style={[styles.delegationNoticeBtn, { backgroundColor: colors.primary }]}
                      >
                        <Text style={styles.delegationNoticeBtnText}>Go to Lead Details →</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null
                }
                ListFooterComponent={
                  messages.loadingMore ? (
                    <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : isPrivateAgentChat ? (
                    <View
                      style={[
                        styles.preDelegationBanner,
                        {
                          backgroundColor: isDark ? '#261219' : '#fdf6f8',
                          borderColor: isDark ? '#4a0f1f' : '#efe3e8',
                        },
                      ]}
                    >
                      <Text style={[styles.preDelegationBannerText, { color: isDark ? '#f4a5b8' : '#5f5360' }]}>
                        💬 Below is the message history prior to agent delegation.
                      </Text>
                    </View>
                  ) : null
                }
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    isCurrentUser={item.senderUserId === session.currentUser?.id}
                    isStarred={messages.starredMsgIds.has(item.id)}
                    onLongPressMessage={(msg: ChatMessage) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      modals.openActionModal(msg);
                    }}
                    onReactToMessage={messages.handleReactToMessage}
                    onPressMedia={(url: string, kind: string) =>
                      media.openMediaViewer(url, kind === 'video' ? 'video' : 'image')
                    }
                    onSendInquiryResponse={messages.handleSendInquiryResponse}
                  />
                )}
                contentContainerStyle={[
                  styles.messagesContent,
                  { paddingBottom: 16, paddingTop: 12 },
                ]}
              />
            )}

            {/* Rate Limit Cooldown Notice */}
            {messages.rateLimitCooldown && (
              <View style={styles.rateLimitBanner}>
                <Ionicons name="hourglass-outline" size={14} color="#d97706" style={{ marginRight: 6 }} />
                <Text style={styles.rateLimitBannerText}>
                  Sending slowed (rate limit reached) · Auto-retrying...
                </Text>
              </View>
            )}

            {/* Chat Composer, Blocked Notice, or Private Agent Thread Notice */}
            {session.conversation?.isBlocked ? (
              <View
                style={[
                  styles.privacyComposerBar,
                  {
                    backgroundColor: isDark ? '#1a1012' : '#fef2f2',
                    borderTopColor: isDark ? '#7f1d1d' : '#fecaca',
                    paddingVertical: 14,
                  },
                ]}
              >
                <Ionicons
                  name="ban"
                  size={15}
                  color={isDark ? '#f87171' : '#dc2626'}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.privacyComposerText, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>
                  {session.conversation.blockedByMe
                    ? 'You have blocked this contact. Tap menu to unblock.'
                    : 'This contact is currently unavailable for direct messages.'}
                </Text>
              </View>
            ) : isPrivateAgentChat ? (
              <View
                style={[
                  styles.privacyComposerBar,
                  {
                    backgroundColor: isDark ? '#1a0d13' : '#fdf6f8',
                    borderTopColor: isDark ? '#4a0f1f' : '#efe3e8',
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={isDark ? '#f4a5b8' : '#4a0f1f'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.privacyComposerText, { color: isDark ? '#f4a5b8' : '#5f5360' }]}>
                  Private agent thread · Delegated to{' '}
                  {session.conversation?.assignment?.assignedAgentName ||
                    session.conversation?.assignment?.agent?.fullName ||
                    'agent'}
                </Text>
              </View>
            ) : (
              <ChatComposer
                value={messages.composerText}
                onChangeText={(text) => {
                  messages.setComposerText(text);
                  handleComposerTextChange(text);
                }}
                onSend={messages.handleSendMessage}
                onSendVoiceNote={media.handleSendVoiceNote}
                onSelectAttachment={handleSelectAttachment}
                replyingToMessage={
                  messages.replyingToMessage
                    ? {
                        id: messages.replyingToMessage.id,
                        authorName: messages.replyingToMessage.authorName,
                        body: messages.replyingToMessage.body,
                      }
                    : null
                }
                onCancelReply={() => messages.setReplyingToMessage(null)}
              />
            )}
          </KeyboardAvoidingView>
        )}

        {/* Message Action Sheet Modal */}
        <MessageActionModal
          visible={modals.isActionVisible}
          message={modals.actionMessage}
          isCurrentUser={modals.actionMessage?.senderUserId === session.currentUser?.id}
          isStarred={modals.actionMessage ? messages.starredMsgIds.has(modals.actionMessage.id) : false}
          onClose={modals.closeModal}
          onReact={(emoji: string) => {
            if (modals.actionMessage) messages.handleReactToMessage(modals.actionMessage.id, emoji);
          }}
          onReply={(msg: ChatMessage) => messages.setReplyingToMessage(msg)}
          onStarToggle={(msgId: string) => messages.handleToggleStar(msgId)}
          onAskAI={(msg: ChatMessage) => {
            modals.openAskAIModal(msg);
          }}
          onDelete={(msgId: string) => messages.handleDeleteMessage(msgId)}
        />

        {/* Chat Info Modal */}
        <ChatInfoModal
          visible={modals.isChatInfoVisible}
          conversation={session.conversation}
          messagesCount={messages.messages.length}
          onClose={modals.closeModal}
          onAddAsLead={() => modals.openModal('lead_capture')}
          onToggleArchive={session.handleToggleArchive}
          onViewStarred={() => modals.openModal('starred')}
        />

        {/* Lead Capture Modal (DeltanHub Web LeadCaptureDialog Parity) */}
        <LeadCaptureModal
          visible={modals.isLeadCaptureVisible}
          onClose={modals.closeModal}
          initialFullName={session.conversation?.partnerName || ''}
          onSubmit={session.handleConvertToLead}
        />

        {/* Media Preview Modal */}
        <MediaPreviewModal
          visible={media.mediaPreviewVisible}
          assets={media.stagedMediaAssets}
          isSending={media.isUploadingMedia}
          onCancel={media.closeMediaPreview}
          onSend={media.handleSendStagedMedia}
        />

        {/* Full-screen Media Viewer Modal */}
        <MediaViewerModal
          visible={media.mediaViewerVisible}
          mediaUrl={media.mediaViewerUrl}
          mediaKind={media.mediaViewerKind}
          onClose={media.closeMediaViewer}
        />

        {/* Property Catalog Modal */}
        <PropertyCatalogModal
          visible={modals.isCatalogVisible}
          onClose={modals.closeModal}
          onSelectListing={messages.handleSendCatalogListing}
        />

        {/* Inquiry Form Questionnaire Modal */}
        <InquiryFormModal
          visible={modals.isInquiryFormVisible}
          onClose={modals.closeModal}
          onSelectTemplate={messages.handleSendInquiryTemplate}
        />

        {/* 3D Virtual Tour & Video Embed Modal */}
        <EmbedUrlModal
          visible={modals.isEmbedVisible}
          onClose={modals.closeModal}
          onSubmit={messages.handleSendEmbed}
        />

        {/* Report Modal */}
        <ReportModal
          visible={modals.isReportVisible}
          targetName={session.conversation?.partnerName || 'User'}
          onClose={modals.closeModal}
          onSubmitReport={session.handleSubmitReport}
        />

        {/* Deltan Intelligence / Ask AI Modal */}
        <AskAIModal
          visible={modals.isAskAIVisible}
          message={modals.askAIMessage}
          onClose={modals.closeModal}
          onInsertToComposer={(text) => {
            messages.setComposerText((prev) => (prev ? `${prev}\n${text}` : text));
          }}
        />

        {/* Starred Messages Viewer Modal */}
        <StarredMessagesModal
          visible={modals.isStarredVisible}
          onClose={modals.closeModal}
          conversationId={conversationId}
          conversationTitle={
            session.conversation?.title || session.conversation?.partnerName || 'Chat'
          }
          onUnstarMessage={(msgId) => {
            messages.handleToggleStar(msgId);
          }}
          onJumpToMessage={(msgId, convId) => {
            if (convId && convId !== conversationId) {
              router.push(`/thread/${convId}`);
            } else {
              const targetIndex = messages.messages.findIndex((m) => m.id === msgId);
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
          visible={modals.isAssignmentVisible}
          onClose={modals.closeModal}
          conversationId={conversationId}
          currentAssignedAgentId={
            session.conversation?.assignment?.assignedAgentUserId ||
            session.conversation?.assigned_to_user_id
          }
          onAssignmentComplete={() => {
            session.fetchConversationDetails();
            messages.fetchMessages();
          }}
        />

        {/* Confidential Lead Internal Notes Modal */}
        <LeadInternalNotesModal
          visible={modals.isInternalNotesVisible}
          onClose={modals.closeModal}
          conversationId={conversationId}
          inquiryId={session.conversation?.assignment?.leadId}
          title="Confidential Lead Notes"
        />

        {/* Quick Status Selection Modal */}
        <Modal
          visible={modals.isLeadStatusVisible}
          transparent
          animationType="fade"
          onRequestClose={modals.closeModal}
        >
          <Pressable style={styles.leadModalBackdrop} onPress={modals.closeModal}>
            <View
              style={[
                styles.leadStatusCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.leadModalTitle, { color: colors.text }]}>
                Update Pipeline Stage
              </Text>
              <Text style={[styles.leadModalSubtitle, { color: colors.placeholder }]}>
                Select the current sales progress stage for this inquiry
              </Text>

              {STATUS_PIPELINE.map((st) => {
                const currentStatus = session.conversation?.assignment?.status;
                const isCurrent =
                  currentStatus === st.value ||
                  (st.value === 'closed_won' && currentStatus === 'closed') ||
                  (st.value === 'closed_lost' && currentStatus === 'lost');
                return (
                  <TouchableOpacity
                    key={st.value}
                    onPress={() => {
                      session.handleUpdateLeadStatus(st.value);
                      modals.closeModal();
                    }}
                    style={[
                      styles.leadStatusOption,
                      isCurrent && { backgroundColor: isDark ? '#262626' : '#f1f5f9' },
                    ]}
                  >
                    <View
                      style={[
                        styles.leadStripStatusDot,
                        {
                          backgroundColor: st.color,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.leadStatusOptionText,
                        { color: colors.text, fontWeight: isCurrent ? '700' : '500' },
                      ]}
                    >
                      {st.label}
                    </Text>
                    {isCurrent && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Modal>
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
  leadStripContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  leadStripTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadStripStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadStripStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  leadStripStatusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  leadStripActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leadStripPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  leadStripPillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    maxWidth: 140,
  },
  leadStripIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadStripShareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  leadStripShareText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  leadStripHandoffBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  leadStripHandoffText: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: Typography.fontFamily,
    flex: 1,
  },
  leadModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  leadStatusCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  leadModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  leadModalSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    fontFamily: Typography.fontFamily,
  },
  leadStatusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 3,
  },
  leadStatusOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    marginLeft: 8,
  },
  privacyNoticeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  privacyNoticeCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  privacyNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  privacyNoticeSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  privacyNoticeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  privacyNoticeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  delegationNoticeCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 10,
  },
  delegationNoticeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginBottom: 8,
  },
  delegationNoticeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  delegationNoticeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  preDelegationBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginVertical: 12,
  },
  preDelegationBannerText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
  privacyComposerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  privacyComposerText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});
