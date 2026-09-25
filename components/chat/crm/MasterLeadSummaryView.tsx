import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './summaryStyles';
import MasterLeadSummaryMetrics from './MasterLeadSummaryMetrics';
import type { ChatConversation } from '../ConversationRow';
import type { ChatMessage } from '../MessageBubble';

export interface MasterLeadSummaryViewProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  colors: any;
  isDark: boolean;
  buyerMsgCount: number;
  agentMsgCount: number;
  lastContactTime: string;
  firstContactTime: string;
  responseTimeText: string;
  firstReplySub: string;
  lastMsg?: ChatMessage;
  agentUserId?: string | null;
}

export default function MasterLeadSummaryView({
  conversation,
  messages,
  colors,
  isDark,
  buyerMsgCount,
  agentMsgCount,
  lastContactTime,
  firstContactTime,
  responseTimeText,
  firstReplySub,
  lastMsg,
  agentUserId,
}: MasterLeadSummaryViewProps) {
  const assignment = conversation.assignment;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Privacy Notice */}
      <View
        style={[
          styles.privacyBox,
          {
            backgroundColor: isDark ? '#261219' : '#fdf6f8',
            borderColor: isDark ? '#4a0f1f' : '#efe3e8',
          },
        ]}
      >
        <View style={styles.privacyHeader}>
          <Ionicons name="lock-closed" size={14} color={isDark ? '#f4a5b8' : '#4a0f1f'} />
          <Text style={[styles.privacyTitle, { color: isDark ? '#f4a5b8' : '#4a0f1f' }]}>
            Confidential Master Lead
          </Text>
        </View>
        <Text style={[styles.privacyText, { color: isDark ? '#e5e7eb' : '#5f5360' }]}>
          Lead delegated by brokerage firm. Internal notes and assignment controls are visible exclusively to company leadership and assigned agent.
        </Text>
      </View>

      {/* 4 Summary Metrics Grid */}
      <MasterLeadSummaryMetrics
        messagesCount={messages.length}
        buyerMsgCount={buyerMsgCount}
        agentMsgCount={agentMsgCount}
        lastContactTime={lastContactTime}
        isLastMsgByAgent={lastMsg?.senderUserId === agentUserId}
        firstContactTime={firstContactTime}
        latestIntent={conversation.latestIntent}
        responseTimeText={responseTimeText}
        firstReplySub={firstReplySub}
        colors={colors}
      />

      {/* Associated Property */}
      {conversation.listing && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>ASSOCIATED PROPERTY</Text>
          <View style={[styles.propertyRow, { borderColor: colors.border }]}>
            {conversation.listing.imageUrl ? (
              <View style={styles.propertyImgWrap}>
                <Image source={{ uri: conversation.listing.imageUrl }} style={styles.propertyImg} />
              </View>
            ) : (
              <View style={[styles.propertyImgWrap, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="business" size={24} color={colors.placeholder} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.propertyName, { color: colors.text }]} numberOfLines={1}>
                {conversation.listing.title}
              </Text>
              <Text style={[styles.propertySubtitle, { color: colors.placeholder }]}>
                Listing ID: {conversation.listing.id}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Inquiry Summary */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>INQUIRY SUMMARY</Text>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Buyer</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>{conversation.partnerName}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Assigned Agent</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>
            {assignment?.agent?.fullName || assignment?.assignedAgentName || 'Unassigned'}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Lead Status</Text>
          <Text style={[styles.dataValue, { color: colors.primary, fontWeight: '700' }]}>
            {(assignment?.masterLeadStatus || assignment?.status || 'New').toUpperCase()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
