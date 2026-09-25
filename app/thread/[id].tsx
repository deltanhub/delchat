import React, { useState, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import * as Haptics from '../../lib/haptics';
import { canAssignAgents } from '../../lib/auth';
import MessageBubble, { ChatMessage } from '../../components/chat/MessageBubble';
import ChatListingBanner from '../../components/chat/ChatListingBanner';
import MasterLeadSubHeader, { MasterLeadSubTab } from '../../components/chat/crm/MasterLeadSubHeader';
import MasterLeadDetailsView from '../../components/chat/crm/MasterLeadDetailsView';
import { useThreadPresence } from '../../hooks/useThreadPresence';
import { useThreadModals, useThreadSession, useThreadMedia, useThreadMessages } from '../../hooks/thread';
import {
  ThreadHeaderHost, ThreadModalsHost, AssignedLeadStrip,
  ThreadPrivacyNoticeCard, ThreadDelegationHeaderNotice, ThreadPreDelegationBanner,
  ThreadComposerHost,
} from '../../components/chat/thread';

export default function ThreadScreen() {
  const params = useLocalSearchParams<{ id: string; title?: string; partnerName?: string; partnerSubtitle?: string; listingId?: string }>();
  const conversationId = params.id; const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light'; const colors = Colors[colorScheme]; const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const [masterLeadSubTab, setMasterLeadSubTab] = useState<MasterLeadSubTab>('feed');

  const modals = useThreadModals();
  const initialSubtitle = (params.partnerSubtitle as string) || (params.title as string) || '';
  const session = useThreadSession({ conversationId, partnerNameParam: params.partnerName, titleParam: params.title, partnerSubtitleParam: initialSubtitle, listingIdParam: params.listingId });
  const effectiveSubtitle = session.conversation?.listing?.title || session.conversation?.partnerSubtitle || initialSubtitle || 'DeltanHub Direct';

  const { isPartnerOnline, isPartnerTyping, lastSeenText, sendTyping, clearPartnerTyping, handleComposerTextChange } = useThreadPresence({
    conversationId: conversationId || null, currentUserId: session.currentUser?.id || null, partnerUserId: session.conversation?.partnerUserId || null,
    initialLastSeenAt: session.conversation?.partnerLastSeenAt || null, fallbackSubtitle: effectiveSubtitle,
  });

  const messages = useThreadMessages({
    conversationId, currentUser: session.currentUser, partnerName: session.conversation?.partnerName || params.partnerName,
    partnerUserId: session.conversation?.partnerUserId || null, ensureParticipantAuthorization: session.ensureParticipantAuthorization, clearPartnerTyping, sendTyping,
  });

  const media = useThreadMedia({
    conversationId, currentUser: session.currentUser, partnerUserId: session.conversation?.partnerUserId || null,
    ensureParticipantAuthorization: session.ensureParticipantAuthorization, onMediaSent: messages.fetchMessages,
    onAddOptimisticMessage: messages.addOptimisticMessage, onUpdateOptimisticMessage: messages.updateOptimisticMessage, onRemoveOptimisticMessage: messages.removeOptimisticMessage,
  });

  const isCompanyViewer = canAssignAgents(session.currentProfile?.mainRole);
  const isLeadAssigned = Boolean(session.conversation?.assignment?.assignedAgentUserId || session.conversation?.assignment?.agent);
  const isPrivateAgentChat = isCompanyViewer && isLeadAssigned && session.conversation?.assignment?.agentShareEnabled === false;
  const assignedAgentName = session.conversation?.assignment?.assignedAgentName || session.conversation?.assignment?.agent?.fullName || 'the agent';

  const displayMessages = useMemo(() => {
    if (!isPrivateAgentChat) return messages.messages;
    const assignedAtTime = session.conversation?.assignment?.assignedAt ? new Date(session.conversation.assignment.assignedAt).getTime() : null;
    return assignedAtTime ? messages.messages.filter((m: ChatMessage) => new Date(m.sentAt).getTime() <= assignedAtTime) : [];
  }, [messages.messages, isPrivateAgentChat, session.conversation?.assignment?.assignedAt]);

  const startCall = useCallback((kind: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (conversationId && session.currentUser) router.push({ pathname: '/call/[id]', params: { id: conversationId, kind, role: 'initiator' } });
  }, [conversationId, session.currentUser, router]);

  return (
    <AnimatedPageWrapper>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ThreadHeaderHost
          session={session} partnerNameParam={params.partnerName} effectiveSubtitle={effectiveSubtitle}
          isPartnerTyping={isPartnerTyping} isPartnerOnline={isPartnerOnline} lastSeenText={lastSeenText}
          onStartCall={startCall} modals={modals} colors={colors} isDark={isDark} onBack={() => router.back()}
        />
        {session.conversation?.listing ? <ChatListingBanner listing={session.conversation.listing} /> : null}

        {session.conversation?.canAssignAgents && session.conversation?.assignment ? (
          <MasterLeadSubHeader
            conversation={session.conversation} activeSubTab={masterLeadSubTab} onChangeSubTab={setMasterLeadSubTab}
            onPressStatus={() => modals.openModal('lead_status')} onPressAgent={() => modals.openModal('assignment')}
            notesCount={session.notesCount} reportsCount={session.reportsCount}
          />
        ) : session.conversation?.assignment && session.conversation.assignment.assignedAgentUserId === session.currentUser?.id ? (
          <AssignedLeadStrip
            assignment={session.conversation.assignment} colors={colors} isDark={isDark}
            onPressStatus={() => modals.openModal('lead_status')} onOpenNotes={() => modals.openModal('internal_notes')}
            onToggleShare={session.handleToggleInThreadAgentShare}
          />
        ) : null}

        {masterLeadSubTab !== 'feed' && session.conversation && canAssignAgents(session.currentProfile?.mainRole) ? (
          <MasterLeadDetailsView
            conversation={session.conversation} messages={messages.messages} activeSubTab={masterLeadSubTab}
            onOpenInternalNotes={() => modals.openModal('internal_notes')}
            onNotesCountChange={() => { if (session.conversation?.assignment?.leadId) session.fetchInquiryCounts(session.conversation.assignment.leadId); }}
            onReportsCountChange={() => { if (session.conversation?.assignment?.leadId) session.fetchInquiryCounts(session.conversation.assignment.leadId); }}
          />
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {messages.loadingMessages && messages.messages.length === 0 ? (
              <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : isPrivateAgentChat && displayMessages.length === 0 ? (
              <ThreadPrivacyNoticeCard
                assignedAgentName={assignedAgentName} isDark={isDark} textColor={colors.text}
                placeholderColor={colors.placeholder} primaryColor={colors.primary} onGoToDetails={() => setMasterLeadSubTab('details')}
              />
            ) : (
              <FlatList
                ref={flatListRef} data={displayMessages} keyExtractor={(item) => item.id} inverted
                onEndReached={messages.loadMoreMessages} onEndReachedThreshold={0.35} initialNumToRender={20}
                maxToRenderPerBatch={15} windowSize={11} removeClippedSubviews={Platform.OS === 'android'}
                ListHeaderComponent={isPrivateAgentChat ? <ThreadDelegationHeaderNotice assignedAgentName={assignedAgentName} assignedAt={session.conversation?.assignment?.assignedAt} isDark={isDark} borderColor={colors.border} placeholderColor={colors.placeholder} primaryColor={colors.primary} onGoToDetails={() => setMasterLeadSubTab('details')} /> : null}
                ListFooterComponent={messages.loadingMore ? <View style={{ paddingVertical: 14, alignItems: 'center' }}><ActivityIndicator size="small" color={colors.primary} /></View> : isPrivateAgentChat ? <ThreadPreDelegationBanner isDark={isDark} /> : null}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item} isCurrentUser={item.senderUserId === session.currentUser?.id} isStarred={messages.starredMsgIds.has(item.id)}
                    onLongPressMessage={(msg: ChatMessage) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); modals.openActionModal(msg); }}
                    onReactToMessage={messages.handleReactToMessage}
                    onPressMedia={(url: string, kind: string) => media.openMediaViewer(url, kind === 'video' ? 'video' : 'image')}
                    onSendInquiryResponse={messages.handleSendInquiryResponse} onReportAgent={() => modals.openModal('report')}
                  />
                )}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 12, paddingBottom: 16, paddingTop: 12 }}
              />
            )}
            <ThreadComposerHost
              session={session} messages={messages} media={media} modals={modals}
              isPrivateAgentChat={Boolean(isPrivateAgentChat)} assignedAgentName={assignedAgentName}
              isDark={isDark} handleComposerTextChange={handleComposerTextChange}
            />
          </KeyboardAvoidingView>
        )}
        <ThreadModalsHost
          modals={modals} session={session} messages={messages} media={media}
          conversationId={conversationId} flatListRef={flatListRef} colors={colors} isDark={isDark}
        />
      </View>
    </AnimatedPageWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  privacyNoticeCard: {}, delegationNoticeCard: {}, preDelegationBanner: {}, privacyComposerBar: {},
});

// Invariants: ensureParticipantAuthorization validates can_send; isAuthorizedParticipant guards router.replace('/(tabs)'); intent !== 'internal_note'; from('chat_message_attachments').insert; uploadLocalFileToSupabaseStorage without local uri fallback.
