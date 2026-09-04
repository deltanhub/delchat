import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Switch,
  Pressable,
  Modal,
  TouchableOpacity,
  Platform,
  Linking,
  Dimensions,
  Alert,
} from 'react-native';
import EmojiPicker, { getCountryCodeFromFlag } from './EmojiPicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, LinearTransition } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Haptics from '../../lib/haptics';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';

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
}

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onSendInquiryResponse?: (answers: Record<string, any>) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
  onLongPressMessage?: (message: ChatMessage) => void;
}

export const detectPaymentRequest = (body: string): boolean => {
  if (!body) return false;
  const lower = body.toLowerCase();
  const hasTenDigit = /\b\d{10}\b/.test(body);
  const hasBankTerms = /(account|acct|transfer|bank|zenith|gtb|gtbank|access|uba|first\s*bank|kuda|opay|palmpay|fidelity|stanbic|fcmb|wema|sterling|polaris|union\s*bank|providus|moniepoint)\b/i.test(lower);
  const hasPayPhrases = /(pay to|transfer to|send to account|inspection fee|booking deposit|earnest deposit|commitment fee)\b/i.test(lower);

  return (hasTenDigit && (hasBankTerms || hasPayPhrases)) || (hasPayPhrases && hasBankTerms);
};

export default function MessageBubble({
  message,
  isCurrentUser,
  isStarred = false,
  onSendInquiryResponse,
  onReactToMessage,
  onPressMedia,
  onLongPressMessage,
}: MessageBubbleProps) {
  // Never render confidential brokerage internal notes in client feeds
  if (message.intent === 'internal_note' || message.structuredPayload?.isInternalOnly) {
    return null;
  }

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  const hasPaymentWarning = detectPaymentRequest(message.body);

  const formatMsgTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Staff Tag logic for auditing
  const isStaffMessage =
    message.senderType === 'admin' ||
    message.authorRoleLabel === 'Agency representative' ||
    message.authorRoleLabel === 'Agency' ||
    message.authorRoleLabel === 'Developer' ||
    message.authorRoleLabel === 'Assigned agent' ||
    message.authorRoleLabel === 'Agent';

  let staffTag: string | null = null;
  if (isStaffMessage) {
    if (message.authorRoleLabel === 'Agency representative' || message.authorRoleLabel === 'Agency') {
      staffTag = 'sent by agency';
    } else if (message.authorRoleLabel === 'Developer') {
      staffTag = 'sent by developer';
    } else if (message.authorRoleLabel === 'Assigned agent' || message.authorRoleLabel === 'Agent') {
      staffTag = `sent by ${message.authorName}`;
    } else {
      staffTag = `sent by ${message.authorName}`;
    }
  }

  // Parse Assigned Agent Card from structuredPayload
  const getAssignedAgentCard = () => {
    const payload = message.structuredPayload;
    if (!payload && message.messageKind !== 'agent_card') {
      return null;
    }

    if (payload?.card_kind === 'assigned_agent') {
      const agent = payload.agent || {};
      return {
        actionLabel: payload.actionLabel || 'assigned',
        agencyName: payload.agencyName || null,
        assignedByName: payload.assignedByName || null,
        agent: {
          userId: agent.userId || '',
          fullName: agent.fullName || 'Assigned Agent',
          subtitle: agent.subtitle || 'Assigned agent',
          avatarUrl: agent.avatarUrl || null,
          email: agent.email || null,
          phone: agent.phone || null,
          profileHref: agent.profileHref || `/agents/${agent.userId}`,
        },
      };
    }

    if (payload?.agentCard || message.messageKind === 'agent_card') {
      const agent = payload?.agentCard || {};
      return {
        actionLabel: agent.actionLabel || 'assigned',
        agencyName: agent.agencyName || null,
        assignedByName: agent.assignedBy || null,
        agent: {
          userId: agent.agentUserId || agent.userId || '',
          fullName: agent.agentName || agent.fullName || 'Assigned Agent',
          subtitle: agent.agentRole || agent.subtitle || 'Assigned agent',
          avatarUrl: agent.agentAvatar || agent.avatarUrl || null,
          email: agent.agentEmail || agent.email || null,
          phone: agent.agentPhone || agent.phone || null,
          profileHref: `/agents/${agent.agentUserId || agent.userId}`,
        },
      };
    }

    return null;
  };

  const assignedAgentCard = getAssignedAgentCard();

  if (assignedAgentCard) {
    return (
      <Animated.View
        entering={FadeInDown.duration(280).springify().damping(14).mass(0.7)}
        layout={LinearTransition.springify().damping(14)}
        style={styles.agentCardOuter}
      >
        <View style={[styles.agentCardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.agentCardAction, { color: isDark ? '#ffffff' : colors.primary }]}>
            {assignedAgentCard.actionLabel === 'reassigned' ? 'Agent updated' : 'Agent introduced'}
          </Text>
          <Text style={[styles.agentCardName, { color: colors.text }]}>
            {assignedAgentCard.agent.fullName}
          </Text>
          <Text style={[styles.agentCardSubtitle, { color: colors.placeholder }]}>
            {assignedAgentCard.agent.subtitle}
          </Text>
          
          <Text style={[styles.agentCardDescription, { color: isDark ? '#d1d5db' : '#5f6f83' }]}>
            {assignedAgentCard.agencyName ?? 'The agency'} added this agent to the thread so the buyer can review the profile and continue the conversation before direct outreach.
          </Text>

          <View style={styles.agentCardContactBox}>
            {assignedAgentCard.agent.email && (
              <Text style={[styles.agentCardContactText, { color: colors.text }]}>
                ✉️  {assignedAgentCard.agent.email}
              </Text>
            )}
            {assignedAgentCard.agent.phone && (
              <Text style={[styles.agentCardContactText, { color: colors.text }]}>
                📞  {assignedAgentCard.agent.phone}
              </Text>
            )}
            {assignedAgentCard.assignedByName && (
              <Text style={[styles.agentCardAssignedBy, { color: colors.placeholder }]}>
                Assigned by {assignedAgentCard.assignedByName}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => router.push(`/agent/${assignedAgentCard.agent.userId}` as any)}
            style={({ pressed }) => [
              styles.agentCardBtn,
              {
                borderColor: isDark ? '#3f3f46' : colors.border,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={[styles.agentCardBtnText, { color: colors.text }]}>View Profile</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 3 }}>
            {isStarred && (
              <Ionicons name="star" size={11} color="#f59e0b" />
            )}
            <Text style={[styles.agentCardTime, { color: colors.placeholder }]}>
              {formatMsgTime(message.sentAt)}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Render System messages
  if (message.messageKind === 'system' || message.senderType === 'system') {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        layout={LinearTransition.springify().damping(14)}
        style={styles.systemContainer}
      >
        <View style={[styles.systemBubble, { backgroundColor: isDark ? '#1c1c1e' : '#eef2f7' }]}>
          <Text style={[styles.systemText, { color: isDark ? '#a1a1aa' : '#556980' }]}>
            {message.body}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Render Listing Cards
  if (message.messageKind === 'listing_card' && message.listingCard) {
    const listing = message.listingCard;
    return (
      <Animated.View
        entering={isCurrentUser ? FadeInDown.duration(280).springify().damping(14).mass(0.7) : FadeInUp.duration(240).springify().damping(14).mass(0.7)}
        layout={LinearTransition.springify().damping(14)}
        style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}
      >
        <View style={[styles.bubbleContainer, styles.cardWidth]}>
          {!isCurrentUser && (
            <Text style={[styles.authorLabel, { color: isDark ? '#ffffff' : colors.primary }]}>{message.authorName}</Text>
          )}
          <View
            style={[
              styles.listingCard,
              {
                backgroundColor: isCurrentUser
                  ? isDark
                    ? '#1f1318'
                    : '#fdf3f5'
                  : colors.card,
                borderColor: isCurrentUser ? (isDark ? '#3a1a24' : 'rgba(74, 15, 31, 0.15)') : colors.border,
              },
            ]}
          >
            <Text style={[styles.badgeTitle, { color: isDark ? '#ffffff' : colors.primary }]}>PROPERTY CATALOG</Text>
            
            <Pressable
              onPress={() => {
                const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
                const propertyUrl = `${siteUrl}/property/${listing.id}`;
                Linking.openURL(propertyUrl).catch(() => {
                  Alert.alert(
                    listing.title || 'Listing Details',
                    `Location: ${listing.address || [listing.city, listing.state].filter(Boolean).join(', ') || 'Nigeria'}\nRef: ${listing.referenceCode || listing.id}\n\nView complete details and high-res media online at:\n${propertyUrl}`
                  );
                });
              }}
              style={({ pressed }) => [
                styles.listingLinkContainer,
                {
                  opacity: pressed ? 0.95 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              {listing.imageUrl ? (
                <Image source={{ uri: listing.imageUrl }} style={styles.listingImage} resizeMode="cover" />
              ) : (
                <View style={[styles.listingImagePlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name="home" size={32} color={colors.placeholder} />
                </View>
              )}
              <View style={styles.listingInfo}>
                <Text style={[styles.listingTitleText, { color: colors.text }]} numberOfLines={1}>
                  {listing.title}
                </Text>
                <Text style={[styles.listingRefText, { color: colors.placeholder }]} numberOfLines={1}>
                  {listing.referenceCode ? `Ref: ${listing.referenceCode} · ` : ''}
                  {listing.address || [listing.city, listing.state].filter(Boolean).join(', ')}
                </Text>
                <View style={styles.listingBadgeRow}>
                  {listing.listingType && (
                    <View style={styles.listingTypeBadge}>
                      <Text style={styles.listingTypeBadgeText}>{listing.listingType}</Text>
                    </View>
                  )}
                  {listing.listingStatus && (
                    <View style={styles.listingStatusBadge}>
                      <Text style={styles.listingStatusBadgeText}>{listing.listingStatus}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>

            {message.body && message.body !== 'Shared property card' && (
              <Text style={[styles.listingBodyText, { color: colors.text }]}>{message.body}</Text>
            )}

            <View style={styles.timeContainer}>
              {isStarred && (
                <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
              )}
              <Text style={[styles.timeText, { color: colors.placeholder }]}>
                {formatMsgTime(message.sentAt)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Render Inquiry Forms
  if (message.messageKind === 'inquiry_form' && message.inquiryFormCard) {
    const form = message.inquiryFormCard;
    const fields = form.fields || [];

    const handleFormSubmit = () => {
      if (formSubmitted) return;
      
      // Perform simple validation
      for (const field of fields) {
        if (field.isRequired && (formAnswers[field.id] === undefined || formAnswers[field.id] === '')) {
          Alert.alert('Required Field', `Please complete the required field: ${field.fieldLabel}`);
          return;
        }
      }

      setFormSubmitted(true);
      if (onSendInquiryResponse) {
        onSendInquiryResponse({
          templateId: form.templateId,
          templateTitle: form.title,
          answers: fields.map((f) => ({
            label: f.fieldLabel,
            value: formAnswers[f.id] !== undefined ? formAnswers[f.id] : '',
          })),
        });
      }
    };

    return (
      <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
        <View style={[styles.inquiryCard, { backgroundColor: colors.card, borderColor: isDark ? '#3a1a24' : '#efe3e8' }]}>
          <View style={[styles.inquiryHeader, { backgroundColor: isDark ? '#1f1318' : '#fdf6f8', borderBottomColor: isDark ? '#3a1a24' : '#efe3e8' }]}>
            <Ionicons name="clipboard-outline" size={18} color={isDark ? '#ffffff' : '#4a0f1f'} style={{ marginRight: 6 }} />
            <Text style={[styles.inquiryHeaderTitle, { color: isDark ? '#ffffff' : '#4a0f1f' }]}>{form.title || 'Inquiry Form'}</Text>
          </View>
          {form.description && <Text style={[styles.inquiryDesc, { color: isDark ? '#d1d5db' : '#5f5360' }]}>{form.description}</Text>}

          <View style={styles.inquiryFormBody}>
            {fields.map((field) => (
              <View key={field.id} style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  {field.fieldLabel} {field.isRequired && <Text style={{ color: '#a4243b' }}>*</Text>}
                </Text>

                {field.fieldType === 'boolean' ? (
                  <View style={styles.switchRow}>
                    <Switch
                      value={!!formAnswers[field.id]}
                      onValueChange={(val) => setFormAnswers((prev) => ({ ...prev, [field.id]: val }))}
                      trackColor={{ false: isDark ? '#3f3f46' : '#d9bec7', true: colors.primary }}
                      thumbColor="#ffffff"
                      disabled={formSubmitted}
                    />
                    <Text style={[styles.switchText, { color: colors.text }]}>
                      {formAnswers[field.id] ? 'Yes' : 'No'}
                    </Text>
                  </View>
                ) : (
                  <TextInput
                    style={[styles.fieldInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}
                    placeholder={field.fieldType === 'date' ? 'YYYY-MM-DD' : ''}
                    placeholderTextColor={colors.placeholder}
                    keyboardType={field.fieldType === 'number' ? 'numeric' : 'default'}
                    value={formAnswers[field.id]?.toString() || ''}
                    onChangeText={(val) => setFormAnswers((prev) => ({ ...prev, [field.id]: val }))}
                    editable={!formSubmitted}
                  />
                )}
              </View>
            ))}

            <Pressable
              onPress={handleFormSubmit}
              disabled={formSubmitted}
              style={[
                styles.formSubmitBtn,
                { backgroundColor: formSubmitted ? colors.border : colors.primary },
              ]}
            >
              <Text style={styles.formSubmitBtnText}>
                {formSubmitted ? 'Submitted' : 'Submit Request'}
              </Text>
            </Pressable>

            {/* Legal Disclaimer */}
            <View style={[styles.disclaimerRow, { borderTopColor: isDark ? '#3a1a24' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.placeholder} style={{ marginTop: 1 }} />
              <Text style={[styles.disclaimerText, { color: colors.placeholder }]}>
                Exploratory only. Subject to formal contract, title audit & KYC verification under Nigerian Law.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Render Inquiry Responses
  if (message.messageKind === 'inquiry_response' && message.inquiryResponseCard) {
    const resp = message.inquiryResponseCard;
    const answers = resp.answers || [];
    return (
      <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
        <View style={[styles.inquiryResponseCard, { backgroundColor: colors.card, borderColor: isDark ? '#064e3b' : '#cceadd' }]}>
          <View style={[styles.inquiryResponseHeader, { backgroundColor: isDark ? '#064e3b' : '#e6f6ed', borderBottomColor: isDark ? '#047857' : '#cceadd' }]}>
            <Ionicons name="checkmark-circle" size={16} color={isDark ? '#34d399' : '#1f8e55'} style={{ marginRight: 6 }} />
            <Text style={[styles.inquiryResponseHeaderTitle, { color: isDark ? '#ffffff' : '#1f8e55' }]}>{resp.templateTitle} Submitted</Text>
          </View>
          <View style={styles.inquiryResponseBody}>
            {answers.map((ans, idx) => (
              <View key={idx} style={[styles.responseAnswerRow, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.03)' }]}>
                <Text style={[styles.answerLabel, { color: colors.placeholder }]}>{ans.label}</Text>
                <Text style={[styles.answerValue, { color: colors.text }]}>
                  {typeof ans.value === 'boolean' ? (ans.value ? 'Yes' : 'No') : ans.value}
                </Text>
              </View>
            ))}

            {/* Legal Disclaimer */}
            <View style={[styles.disclaimerRow, { borderTopColor: isDark ? '#064e3b' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.placeholder} style={{ marginTop: 1 }} />
              <Text style={[styles.disclaimerText, { color: colors.placeholder }]}>
                Submitted terms are exploratory and subject to contract. Does not constitute a binding conveyance.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Render Marketing Broadcast Card
  if (
    message.messageKind === 'broadcast' ||
    message.structuredPayload?.is_broadcast
  ) {
    const payload = message.structuredPayload || {};
    const title = payload.title || 'Official Announcement';
    const body = payload.body || message.body;
    const media = (payload.media || []) as Array<{ kind: 'image' | 'video' | 'tour'; url: string; title?: string }>;
    const ctaLabel = payload.cta_label;
    const ctaUrl = payload.cta_url;

    return (
      <View style={[styles.rowContainer, styles.justifyLeft, { marginVertical: 8 }]}>
        <View style={{ width: '92%', maxWidth: 420 }}>
          {/* Header Tag */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#5C1324', letterSpacing: 0.8 }}>
              DELTANHUB
            </Text>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#5C1324', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={9} color="#ffffff" />
            </View>
            <View style={{ backgroundColor: '#faecef', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#5C1324' }}>
                OFFICIAL ANNOUNCEMENT
              </Text>
            </View>
          </View>

          {/* Card Container */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderTopLeftRadius: 6,
              borderWidth: 1,
              borderColor: isDark ? '#3a1a24' : '#eedde2',
              overflow: 'hidden',
              shadowColor: '#5C1324',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {/* Images / Flyers */}
            {media.filter((m) => m.kind === 'image').map((img, idx) => (
              <Pressable
                key={idx}
                onPress={() => onPressMedia?.(img.url, 'image', img.title || title)}
                style={{ width: '100%', height: 200, backgroundColor: '#f5eff1' }}
              >
                <Image source={{ uri: img.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </Pressable>
            ))}

            {/* Video preview / launcher */}
            {media.filter((m) => m.kind === 'video').map((vid, idx) => (
              <Pressable
                key={idx}
                onPress={() => Linking.openURL(vid.url)}
                style={{
                  width: '100%',
                  height: 140,
                  backgroundColor: '#101828',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#5C1324', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="play" size={22} color="#ffffff" style={{ marginLeft: 2 }} />
                </View>
                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700', marginTop: 6 }}>
                  Watch Promotional Video ↗
                </Text>
              </Pressable>
            ))}

            {/* 3D Tour launcher */}
            {media.filter((m) => m.kind === 'tour').map((tour, idx) => (
              <Pressable
                key={idx}
                onPress={() => Linking.openURL(tour.url)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  backgroundColor: isDark ? '#201015' : '#fcf5f7',
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? '#3a1a24' : '#f0e0e5',
                }}
              >
                <Ionicons name="cube" size={20} color="#5C1324" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#5C1324' }}>
                    Interactive 3D Virtual Tour
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.placeholder }}>
                    Tap to open immersive tour ↗
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#5C1324" />
              </Pressable>
            ))}

            {/* Content Body */}
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6, lineHeight: 22 }}>
                {title}
              </Text>
              <Text style={{ fontSize: 13, color: isDark ? '#d1d5db' : '#374151', lineHeight: 20 }}>
                {body}
              </Text>

              {/* Call To Action Button */}
              {ctaLabel && ctaUrl && (
                <Pressable
                  onPress={() => Linking.openURL(ctaUrl)}
                  style={({ pressed }) => [
                    {
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: '#5C1324',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                    {ctaLabel}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                </Pressable>
              )}

              {/* Footer info */}
              <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? '#27272a' : '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 10, color: colors.placeholder }}>Broadcast Announcement</Text>
                <Text style={{ fontSize: 10, color: colors.placeholder }}>{formatMsgTime(message.sentAt)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Render 3D Virtual Tour / Embed Card
  if (
    message.messageKind === 'embed' ||
    message.structuredPayload?.card_kind === 'embed' ||
    message.structuredPayload?.embed
  ) {
    const embedData = message.structuredPayload?.embed || message.structuredPayload || {};
    const embedUrl = embedData.url || message.body;
    const embedTitle = embedData.title || '3D Virtual Tour / Embed';

    return (
      <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
        <View style={[styles.embedCard, { backgroundColor: colors.card, borderColor: isDark ? '#3b2354' : '#e9ddfc' }]}>
          <View style={[styles.embedHeader, { backgroundColor: isDark ? '#220c3a' : '#f5effe', borderBottomColor: isDark ? '#3b2354' : '#e9ddfc' }]}>
            <Ionicons name="cube" size={18} color={isDark ? '#c084fc' : '#7c3aed'} style={{ marginRight: 6 }} />
            <Text style={[styles.embedHeaderTitle, { color: isDark ? '#c084fc' : '#7c3aed' }]}>3D VIRTUAL TOUR</Text>
          </View>
          <View style={styles.embedBody}>
            <Text style={[styles.embedTitle, { color: colors.text }]}>{embedTitle}</Text>
            <Text style={[styles.embedUrlText, { color: colors.placeholder }]} numberOfLines={1}>
              {embedUrl}
            </Text>
            <Pressable
              onPress={() => embedUrl && Linking.openURL(embedUrl).catch(() => null)}
              accessibilityLabel={`Launch 3D Virtual Space: ${embedTitle}`}
              accessibilityRole="button"
              accessibilityHint="Opens interactive 3D virtual tour in browser"
              style={({ pressed }) => [
                styles.embedActionBtn,
                {
                  backgroundColor: isDark ? '#7c3aed' : '#6d28d9',
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Ionicons name="open-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.embedActionBtnText}>Launch 3D Space</Text>
            </Pressable>
            <View style={styles.timeRow}>
              {isStarred && (
                <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
              )}
              <Text style={[styles.msgTimeText, { color: colors.placeholder }]}>
                {formatMsgTime(message.sentAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Render Lead Card
  if (
    message.messageKind === 'lead' ||
    message.structuredPayload?.card_kind === 'lead' ||
    message.structuredPayload?.lead
  ) {
    const leadData = message.structuredPayload?.lead || message.structuredPayload || {};
    const leadName = leadData.fullName || leadData.name || 'New Client Lead';
    const leadEmail = leadData.email;
    const leadPhone = leadData.phone;
    const leadBudget = leadData.budget;
    const leadNotes = leadData.notes || message.body;

    return (
      <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
        <View style={[styles.leadCard, { backgroundColor: colors.card, borderColor: isDark ? '#14412e' : '#cceadd' }]}>
          <View style={[styles.leadHeader, { backgroundColor: isDark ? '#082f1f' : '#e6f6ed', borderBottomColor: isDark ? '#14412e' : '#cceadd' }]}>
            <Ionicons name="person-add" size={18} color={isDark ? '#34d399' : '#047857'} style={{ marginRight: 6 }} />
            <Text style={[styles.leadHeaderTitle, { color: isDark ? '#34d399' : '#047857' }]}>LEAD CAPTURED</Text>
          </View>
          <View style={styles.leadBody}>
            <Text style={[styles.leadName, { color: colors.text }]}>{leadName}</Text>
            {leadEmail && <Text style={[styles.leadDetailText, { color: colors.text }]}>✉️  {leadEmail}</Text>}
            {leadPhone && <Text style={[styles.leadDetailText, { color: colors.text }]}>📞  {leadPhone}</Text>}
            {leadBudget && (
              <Text style={[styles.leadDetailText, { color: isDark ? '#4ade80' : '#047857', fontWeight: '600' }]}>
                💰  Budget: {leadBudget}
              </Text>
            )}
            {leadNotes ? <Text style={[styles.leadNotesText, { color: colors.placeholder }]}>{leadNotes}</Text> : null}
            <View style={styles.timeRow}>
              {isStarred && (
                <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
              )}
              <Text style={[styles.msgTimeText, { color: colors.placeholder }]}>
                {formatMsgTime(message.sentAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const handleQuickReaction = (emoji: string) => {
    onReactToMessage?.(message.id, emoji);
    setShowReactionPopover(false);
  };

  const replyToData = message.structuredPayload?.replyTo;

  // Render Voice Note Bubble (WhatsApp-Style Interactive Audio Player)
  if (message.messageKind === 'voice_note' || message.structuredPayload?.voiceNote) {
    const rawDuration =
      message.structuredPayload?.voiceNote?.durationSeconds ||
      (message as any).voice_note_duration_seconds ||
      3;
    const duration = Math.max(1, Number(rawDuration) || 3);

    return (
      <VoiceNoteBubble
        message={message}
        duration={duration}
        isCurrentUser={isCurrentUser}
        isStarred={isStarred}
        isDark={isDark}
        colors={colors}
        formatMsgTime={formatMsgTime}
        replyToData={replyToData}
        staffTag={staffTag}
        onLongPressMessage={onLongPressMessage}
        showReactionPopover={showReactionPopover}
        setShowReactionPopover={setShowReactionPopover}
        handleQuickReaction={handleQuickReaction}
        setShowFullPicker={setShowFullPicker}
      />
    );
  }

  // Render Standard Text & Attachment Messages
  return (
    <Animated.View
      entering={isCurrentUser ? FadeInDown.duration(260).springify().damping(16).mass(0.8) : FadeInUp.duration(240).springify().damping(16).mass(0.8)}
      layout={LinearTransition.springify().damping(16)}
      style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}
    >
      <View style={{ maxWidth: '82%', alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
        {/* Reactions Popover Menu (Long-press triggered) */}
      {showReactionPopover && (
        <View
          style={[
            styles.popoverContainer,
            isCurrentUser ? styles.popoverRight : styles.popoverLeft,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleQuickReaction(emoji)}
              accessibilityLabel={`React with ${emoji}`}
              accessibilityRole="button"
              style={styles.popoverEmojiBtn}
            >
              <Text style={styles.popoverEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowFullPicker(true)}
            accessibilityLabel="Open all reaction emojis"
            accessibilityRole="button"
            accessibilityHint="Opens full emoji picker sheet"
            style={[
              styles.popoverEmojiBtn,
              styles.popoverPlusBtn,
              { backgroundColor: isDark ? '#2c2c2e' : '#f0f4f8' }
            ]}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <Pressable
        onLongPress={() => {
          if (onLongPressMessage) {
            onLongPressMessage(message);
          } else {
            setShowReactionPopover((prev) => !prev);
          }
        }}
        delayLongPress={260}
        style={({ pressed }) => [
          styles.bubbleTextContainer,
          isCurrentUser
            ? [styles.bubbleCurrent, { backgroundColor: colors.primary }]
            : [styles.bubblePartner, { backgroundColor: colors.card }],
          {
            borderColor: isCurrentUser ? colors.primary : colors.border,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        {!isCurrentUser && (
          <Text style={[styles.authorLabel, { color: isDark ? '#ffffff' : colors.primary }]}>{message.authorName}</Text>
        )}

        {staffTag && (
          <Text style={[styles.staffTagLabel, { color: isCurrentUser ? 'rgba(255, 255, 255, 0.65)' : (isDark ? '#a1a1aa' : '#7b6570') }]}>
            {staffTag}
          </Text>
        )}

        {/* WhatsApp-Style Quoted Reply Box */}
        {replyToData && (
          <View
            style={[
              styles.quotedReplyBox,
              {
                backgroundColor: isCurrentUser ? 'rgba(0, 0, 0, 0.15)' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                borderLeftColor: isCurrentUser ? '#ffffff' : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.quotedAuthor,
                { color: isCurrentUser ? '#ffffff' : (isDark ? '#ffffff' : colors.primary) },
              ]}
              numberOfLines={1}
            >
              {replyToData.authorName || 'Member'}
            </Text>
            <Text
              style={[
                styles.quotedBody,
                { color: isCurrentUser ? 'rgba(255, 255, 255, 0.85)' : colors.placeholder },
              ]}
              numberOfLines={2}
            >
              {replyToData.body || 'Message'}
            </Text>
          </View>
        )}

        {/* Media Attachments (Photos & Videos) */}
        {(() => {
          const mediaItems: ChatAttachmentItem[] = [
            ...(message.attachments ? message.attachments.filter(a => a.kind === 'image' || a.kind === 'video') : []),
            ...(Array.isArray(message.structuredPayload?.attachments)
              ? message.structuredPayload.attachments
                  .filter((a: any) => a && (a.kind === 'image' || a.kind === 'video' || (!a.kind && a.url)))
                  .map((a: any, idx: number) => ({
                    id: a.id || `${message.id}-media-${idx}`,
                    url: a.url,
                    originalName: a.originalName || a.original_name || 'Media',
                    mimeType: a.mimeType || (a.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
                    sizeBytes: a.sizeBytes || a.size_bytes || 0,
                    kind: (a.kind === 'video' ? 'video' : 'image') as 'video' | 'image',
                  }))
              : []),
          ];
          const uniqueMedia = mediaItems.filter((item, index, self) =>
            index === self.findIndex((m) => (m.url && m.url === item.url) || m.id === item.id)
          );

          if (uniqueMedia.length === 0) return null;

          return (
            <View style={styles.mediaGrid}>
              {uniqueMedia.map((att) => (
                <Pressable
                  key={att.id}
                  onPress={() => {
                    if (onPressMedia && att.url) {
                      onPressMedia(att.url, att.kind, att.originalName || message.body || 'Media');
                    } else if (att.url) {
                      Linking.openURL(att.url).catch(() => null);
                    }
                  }}
                  style={styles.mediaItemContainer}
                >
                  <Image source={{ uri: att.url }} style={styles.mediaImage} resizeMode="cover" />
                  {att.kind === 'video' && (
                    <View style={styles.videoOverlayBadge}>
                      <Ionicons name="play-circle" size={32} color="#ffffff" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          );
        })()}

        {/* Document Attachments (both normalized attachments array and structuredPayload.document) */}
        {(() => {
          const docItems: ChatAttachmentItem[] = [
            ...(message.attachments ? message.attachments.filter(a => a.kind === 'document') : []),
            ...(message.structuredPayload?.document
              ? [
                  {
                    id: `${message.id}-doc`,
                    url: message.structuredPayload.document.url,
                    originalName: message.structuredPayload.document.name || 'Document',
                    mimeType: message.structuredPayload.document.mimeType || 'application/pdf',
                    sizeBytes: message.structuredPayload.document.size || 0,
                    kind: 'document' as const,
                  },
                ]
              : []),
          ];

          const uniqueDocs = docItems.filter((doc, index, self) =>
            index === self.findIndex((d) => (d.url && d.url === doc.url) || d.originalName === doc.originalName)
          );

          if (uniqueDocs.length === 0) return null;

          return (
            <View style={styles.docsList}>
              {uniqueDocs.map((att) => {
                const ext = (att.originalName || '').split('.').pop()?.toUpperCase() || 'DOC';
                const isPdf = ext === 'PDF';
                const isExcel = ['XLS', 'XLSX', 'CSV'].includes(ext);
                const isWord = ['DOC', 'DOCX'].includes(ext);

                const badgeColor = isPdf ? '#ef4444' : isExcel ? '#10b981' : isWord ? '#3b82f6' : '#8b5cf6';
                const badgeBg = isDark ? 'rgba(255,255,255,0.08)' : `${badgeColor}18`;

                const formattedSize = att.sizeBytes
                  ? att.sizeBytes > 1024 * 1024
                    ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.round(att.sizeBytes / 1024)} KB`
                  : 'Document';

                return (
                  <Pressable
                    key={att.id}
                    onPress={() => {
                      if (att.url) {
                        Linking.openURL(att.url).catch(() => {
                          Alert.alert('Open File', 'Could not open this file automatically.');
                        });
                      }
                    }}
                    accessibilityLabel={`Document: ${att.originalName}, size ${formattedSize}`}
                    accessibilityRole="button"
                    accessibilityHint="Double tap to open or download document"
                    style={[
                      styles.docItemCard,
                      {
                        backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.15)' : (isDark ? '#1c1c1e' : '#f8fafc'),
                        borderColor: isCurrentUser ? 'rgba(255,255,255,0.25)' : (isDark ? '#2c2c2e' : '#e2e8f0'),
                      },
                    ]}
                  >
                    <View style={[styles.docIconBadge, { backgroundColor: badgeBg }]}>
                      <Ionicons
                        name={isPdf ? "document-text" : isExcel ? "grid" : isWord ? "document" : "document-attach"}
                        size={20}
                        color={badgeColor}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.docNameText, { color: isCurrentUser ? '#ffffff' : colors.text }]} numberOfLines={1}>
                        {att.originalName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <View style={{ backgroundColor: badgeBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9.5, fontWeight: '700', color: badgeColor }}>{ext}</Text>
                        </View>
                        <Text style={[styles.docSizeText, { color: isCurrentUser ? 'rgba(255,255,255,0.75)' : colors.placeholder }]}>
                          {formattedSize}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.docActionBtn, { backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : (isDark ? '#2c2c2e' : '#e2e8f0') }]}>
                      <Ionicons name="arrow-down" size={15} color={isCurrentUser ? '#ffffff' : colors.primary} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          );
        })()}

        {message.body ? (
          <Text style={[styles.bubbleText, { color: isCurrentUser ? '#ffffff' : colors.text }]}>
            {message.body}
          </Text>
        ) : null}

        <View style={styles.timeRow}>
          {isStarred && (
            <Ionicons
              name="star"
              size={11}
              color={isCurrentUser ? '#fbbf24' : '#f59e0b'}
              style={{ marginRight: 3 }}
            />
          )}
          <Text style={[styles.msgTimeText, { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.placeholder }]}>
            {formatMsgTime(message.sentAt)}
          </Text>
          {isCurrentUser && (
            <Animated.View entering={ZoomIn.duration(200).springify().damping(14)}>
              {message.status === 'sending' ? (
                <Ionicons name="time-outline" size={13} color="rgba(255, 255, 255, 0.75)" style={{ marginLeft: 3 }} />
              ) : message.status === 'read' ? (
                <Ionicons name="checkmark-done" size={14} color="#38bdf8" style={{ marginLeft: 3 }} />
              ) : message.status === 'delivered' ? (
                <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.85)" style={{ marginLeft: 3 }} />
              ) : message.status === 'error' ? (
                <Ionicons name="alert-circle" size={14} color="#ef4444" style={{ marginLeft: 3 }} />
              ) : (
                <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.85)" style={{ marginLeft: 3 }} />
              )}
            </Animated.View>
          )}
        </View>

        {/* Reactions List */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <View style={[styles.reactionsRow, isCurrentUser ? styles.reactionsRight : styles.reactionsLeft, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {Object.keys(message.reactions).map((emoji) => {
              const flagCode = getCountryCodeFromFlag(emoji);
              if (flagCode) {
                return (
                  <Image
                    key={emoji}
                    source={{ uri: `https://flagcdn.com/w40/${flagCode}.png` }}
                    style={{ width: 14, height: 10, borderRadius: 1, marginHorizontal: 1, alignSelf: 'center' }}
                  />
                );
              }
              return (
                <Text key={emoji} style={styles.reactionEmoji}>
                  {emoji}
                </Text>
              );
            })}
          </View>
        )}
      </Pressable>

      {/* Nigerian Bank Wire Fraud Warning Banner */}
      {hasPaymentWarning && (
        <View
          style={[
            styles.fraudWarningBanner,
            {
              backgroundColor: isDark ? '#261215' : '#fff1f2',
              borderColor: isDark ? '#4c1d24' : '#fecdd3',
            },
          ]}
        >
          <Ionicons name="warning" size={14} color="#e11d48" style={{ marginTop: 1 }} />
          <Text style={[styles.fraudWarningText, { color: isDark ? '#fca5a5' : '#be123c' }]}>
            Security Alert: Never transfer funds to private bank accounts in chat. DeltanHub staff will never ask for direct transfers or inspection fees. Always use official verified escrow.
          </Text>
        </View>
      )}
    </View>

      {/* Full Emoji Picker Modal Sheet */}
      <Modal
        visible={showFullPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFullPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFullPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>React with Emoji</Text>
              <TouchableOpacity onPress={() => setShowFullPicker(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                onReactToMessage?.(message.id, emoji);
                setShowFullPicker(false);
                setShowReactionPopover(false);
              }}
              onClose={() => setShowFullPicker(false)}
            />
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  justifyRight: {
    justifyContent: 'flex-end',
  },
  justifyLeft: {
    justifyContent: 'flex-start',
  },
  bubbleContainer: {
    position: 'relative',
  },
  cardWidth: {
    width: '85%',
  },
  authorLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    paddingLeft: 4,
  },
  staffTagLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bubbleTextContainer: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  bubbleCurrent: {
    borderBottomRightRadius: 2,
  },
  bubblePartner: {
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    lineHeight: 20,
  },
  quotedReplyBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 6,
  },
  quotedAuthor: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Typography.fontFamily,
  },
  quotedBody: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Typography.fontFamily,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  msgTimeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemBubble: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    maxWidth: '85%',
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  listingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  badgeTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  listingLinkContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  listingImage: {
    width: '100%',
    height: 110,
  },
  listingImagePlaceholder: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    padding: 10,
  },
  listingTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listingRefText: {
    fontSize: 11,
    marginTop: 2,
  },
  listingBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  listingTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listingStatusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d97706',
    textTransform: 'uppercase',
  },
  listingBodyText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  timeContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  timeText: {
    fontSize: 10,
  },
  inquiryCard: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf6f8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#efe3e8',
  },
  inquiryHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4a0f1f',
  },
  inquiryDesc: {
    fontSize: 12,
    color: '#5f5360',
    paddingHorizontal: 16,
    paddingTop: 10,
    lineHeight: 16,
  },
  inquiryFormBody: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formSubmitBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  formSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily,
  },
  fraudWarningBanner: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '100%',
  },
  fraudWarningText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  inquiryResponseCard: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inquiryResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f6ed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cceadd',
  },
  inquiryResponseHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f8e55',
  },
  inquiryResponseBody: {
    padding: 16,
    gap: 10,
  },
  responseAnswerRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    paddingBottom: 6,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  answerValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  reactionsRow: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    elevation: 2,
  },
  reactionsRight: {
    right: 8,
  },
  reactionsLeft: {
    left: 8,
  },
  reactionEmoji: {
    fontSize: 11,
  },
  popoverContainer: {
    position: 'absolute',
    top: -46,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  popoverRight: {
    right: 12,
  },
  popoverLeft: {
    left: 12,
  },
  popoverEmojiBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  popoverPlusBtn: {
    marginLeft: 2,
  },
  popoverEmoji: {
    fontSize: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  modalCloseBtn: {
    padding: 4,
  },
  agentCardOuter: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  agentCardContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  agentCardAction: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  agentCardName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    fontFamily: Typography.fontFamily,
  },
  agentCardSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  agentCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    fontFamily: Typography.fontFamily,
  },
  agentCardContactBox: {
    marginTop: 16,
    gap: 6,
  },
  agentCardContactText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  agentCardAssignedBy: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  agentCardBtn: {
    marginTop: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  agentCardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  agentCardTime: {
    fontSize: 10,
    marginTop: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Media & Attachment Styles
  mediaGrid: {
    marginBottom: 6,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 4,
  },
  mediaItemContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
  },
  videoOverlayBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  docsList: {
    marginBottom: 6,
    gap: 6,
  },
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 260,
  },
  docIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docNameText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  docSizeText: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  docActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  // 3D Tour / Embed Card Styles
  embedCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  embedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  embedHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Typography.fontFamily,
  },
  embedBody: {
    padding: 16,
    gap: 8,
  },
  embedTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  embedUrlText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  embedActionBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  embedActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  // Lead Card Styles
  leadCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  leadHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Typography.fontFamily,
  },
  leadBody: {
    padding: 16,
    gap: 6,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Typography.fontFamily,
  },
  leadDetailText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  leadNotesText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily,
  },
  // Voice Note Styles
  voiceNoteBubble: {
    minWidth: 240,
    maxWidth: 310,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  voiceNoteMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  vnPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  vnWaveformCol: {
    flex: 1,
    gap: 4,
  },
  vnWaveformBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.2,
    height: 28,
  },
  vnWaveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  vnMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vnDurationText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  vnSpeedPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  vnSpeedText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  vnAvatarCol: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vnAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  vnAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const WAVEFORM_BAR_HEIGHTS = [
  8, 14, 20, 12, 18, 24, 16, 22, 28, 14, 10, 18, 24, 14, 20, 26, 12, 18, 22, 16, 12, 20, 14, 10,
];

// Global Single-Stream Audio Playback Coordinator
export type ActiveAudioSession = {
  messageId: string;
  sound: Audio.Sound | null;
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

function VoiceNoteBubble({
  message,
  duration,
  isCurrentUser,
  isStarred = false,
  isDark,
  colors,
  formatMsgTime,
  replyToData,
  staffTag,
  onLongPressMessage,
  showReactionPopover,
  setShowReactionPopover,
  handleQuickReaction,
  setShowFullPicker,
}: {
  message: ChatMessage;
  duration: number;
  isCurrentUser: boolean;
  isStarred?: boolean;
  isDark: boolean;
  colors: any;
  formatMsgTime: (t: string) => string;
  replyToData: any;
  staffTag: string | null;
  onLongPressMessage?: (m: ChatMessage) => void;
  showReactionPopover: boolean;
  setShowReactionPopover: React.Dispatch<React.SetStateAction<boolean>>;
  handleQuickReaction: (emoji: string) => void;
  setShowFullPicker: (b: boolean) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const playbackTimerRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const audioUri =
    message.structuredPayload?.voiceNote?.audioUrl ||
    message.structuredPayload?.voiceNote?.localUri ||
    (message.attachments && message.attachments.length > 0 ? message.attachments[0].url : null);

  // Auto-pause when another voice note starts playing
  useEffect(() => {
    const handleActiveChange = (activeMessageId: string | null) => {
      if (activeMessageId !== message.id && isPlaying) {
        setIsPlaying(false);
        if (soundRef.current) {
          soundRef.current.pauseAsync().catch(() => {});
        }
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      }
    };
    audioSessionListeners.add(handleActiveChange);
    return () => {
      audioSessionListeners.delete(handleActiveChange);
    };
  }, [message.id, isPlaying]);

  useEffect(() => {
    return () => {
      stopAudioPlayback(message.id);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [message.id]);

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      setIsPlaying(false);
      stopAudioPlayback(message.id);
      if (soundRef.current) {
        try {
          await soundRef.current.pauseAsync();
        } catch (e) {}
      }
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    } else {
      setIsPlaying(true);
      registerAudioPlayback({
        messageId: message.id,
        sound: soundRef.current,
        pause: () => {
          setIsPlaying(false);
          if (soundRef.current) {
            soundRef.current.pauseAsync().catch(() => {});
          }
          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        },
      });

      if (audioUri) {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });

          if (!soundRef.current) {
            const { sound } = await Audio.Sound.createAsync(
              { uri: audioUri },
              { shouldPlay: true, rate: playbackSpeed, shouldCorrectPitch: true },
              (status) => {
                if (status.isLoaded) {
                  if (status.positionMillis !== undefined) {
                    setPlaybackSeconds(status.positionMillis / 1000);
                  }
                  if (status.didJustFinish) {
                    setIsPlaying(false);
                    stopAudioPlayback(message.id);
                    setPlaybackSeconds(0);
                    soundRef.current?.setPositionAsync(0).catch(() => {});
                  }
                }
              }
            );
            soundRef.current = sound;
            registerAudioPlayback({
              messageId: message.id,
              sound,
              pause: () => {
                setIsPlaying(false);
                sound.pauseAsync().catch(() => {});
                if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
              },
            });
            return;
          } else {
            await soundRef.current.setRateAsync(playbackSpeed, true);
            await soundRef.current.playAsync();
            registerAudioPlayback({
              messageId: message.id,
              sound: soundRef.current,
              pause: () => {
                setIsPlaying(false);
                soundRef.current?.pauseAsync().catch(() => {});
                if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
              },
            });
            return;
          }
        } catch (err) {
          console.warn('Error playing audio sound:', err);
        }
      }

      // Fallback timer simulation for legacy voice notes without audio stream
      const intervalMs = 250 / playbackSpeed;
      playbackTimerRef.current = setInterval(() => {
        setPlaybackSeconds((prev) => {
          const next = prev + 0.25;
          if (next >= duration) {
            setIsPlaying(false);
            stopAudioPlayback(message.id);
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            return 0;
          }
          return next;
        });
      }, intervalMs);
    }
  };

  const handleCycleSpeed = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSpeed: 1 | 1.5 | 2 = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(nextSpeed, true);
      } catch (e) {}
    }
  };

  const formatAudioTime = (secs: number) => {
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = duration > 0 ? playbackSeconds / duration : 0;
  const activeBarsCount = Math.floor(progressRatio * WAVEFORM_BAR_HEIGHTS.length);

  return (
    <Animated.View
      entering={
        isCurrentUser
          ? FadeInDown.duration(260).springify().damping(16).mass(0.8)
          : FadeInUp.duration(240).springify().damping(16).mass(0.8)
      }
      layout={LinearTransition.springify().damping(16)}
      style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}
    >
      {/* Reactions Popover Menu (Long-press triggered) */}
      {showReactionPopover && (
        <View
          style={[
            styles.popoverContainer,
            isCurrentUser ? styles.popoverRight : styles.popoverLeft,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleQuickReaction(emoji)}
              accessibilityLabel={`React with ${emoji}`}
              accessibilityRole="button"
              style={styles.popoverEmojiBtn}
            >
              <Text style={styles.popoverEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowFullPicker(true)}
            accessibilityLabel="Open all reaction emojis"
            accessibilityRole="button"
            accessibilityHint="Opens full emoji picker sheet"
            style={[
              styles.popoverEmojiBtn,
              styles.popoverPlusBtn,
              { backgroundColor: isDark ? '#2c2c2e' : '#f0f4f8' },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <Pressable
        onLongPress={() => {
          if (onLongPressMessage) {
            onLongPressMessage(message);
          } else {
            setShowReactionPopover((prev) => !prev);
          }
        }}
        delayLongPress={260}
        style={({ pressed }) => [
          styles.bubbleTextContainer,
          styles.voiceNoteBubble,
          isCurrentUser
            ? [styles.bubbleCurrent, { backgroundColor: colors.primary }]
            : [styles.bubblePartner, { backgroundColor: colors.card }],
          {
            borderColor: isCurrentUser ? colors.primary : colors.border,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        {!isCurrentUser && (
          <Text style={[styles.authorLabel, { color: isDark ? '#ffffff' : colors.primary }]}>
            {message.authorName}
          </Text>
        )}

        {staffTag && (
          <Text
            style={[
              styles.staffTagLabel,
              {
                color: isCurrentUser
                  ? 'rgba(255, 255, 255, 0.65)'
                  : isDark
                  ? '#a1a1aa'
                  : '#7b6570',
              },
            ]}
          >
            {staffTag}
          </Text>
        )}

        {/* WhatsApp-Style Quoted Reply Box */}
        {replyToData && (
          <View
            style={[
              styles.quotedReplyBox,
              {
                backgroundColor: isCurrentUser
                  ? 'rgba(0, 0, 0, 0.15)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#e2e8f0',
                borderLeftColor: isCurrentUser ? '#ffffff' : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.quotedAuthor,
                { color: isCurrentUser ? '#ffffff' : isDark ? '#ffffff' : colors.primary },
              ]}
              numberOfLines={1}
            >
              {replyToData.authorName || 'Member'}
            </Text>
            <Text
              style={[
                styles.quotedBody,
                { color: isCurrentUser ? 'rgba(255, 255, 255, 0.85)' : colors.placeholder },
              ]}
              numberOfLines={2}
            >
              {replyToData.body || 'Message'}
            </Text>
          </View>
        )}

        {/* Voice Note Player Row */}
        <View style={styles.voiceNoteMainRow}>
          {/* Play / Pause Circle */}
          <TouchableOpacity
            onPress={handleTogglePlay}
            accessibilityLabel={isPlaying ? "Pause voice note" : "Play voice note"}
            accessibilityRole="button"
            accessibilityHint={isPlaying ? "Pauses voice note audio" : `Plays voice note audio, duration ${formatAudioTime(duration)}`}
            style={[
              styles.vnPlayBtn,
              {
                backgroundColor: isCurrentUser
                  ? '#ffffff'
                  : isDark
                  ? '#4A0F1F'
                  : colors.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={
                isCurrentUser
                  ? colors.primary
                  : '#ffffff'
              }
              style={!isPlaying ? { marginLeft: 2 } : undefined}
            />
          </TouchableOpacity>

          {/* Waveform and Duration */}
          <View style={styles.vnWaveformCol}>
            <View style={styles.vnWaveformBarsRow}>
              {WAVEFORM_BAR_HEIGHTS.map((h, i) => {
                const isActive = i <= activeBarsCount;
                return (
                  <View
                    key={i}
                    style={[
                      styles.vnWaveBar,
                      {
                        height: h,
                        backgroundColor: isCurrentUser
                          ? isActive
                            ? '#ffffff'
                            : 'rgba(255, 255, 255, 0.38)'
                          : isActive
                          ? isDark
                            ? '#f4a5b8'
                            : colors.primary
                          : isDark
                          ? '#3f3f46'
                          : '#cbd5e1',
                      },
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.vnMetaRow}>
              <Text
                style={[
                  styles.vnDurationText,
                  {
                    color: isCurrentUser
                      ? 'rgba(255, 255, 255, 0.88)'
                      : colors.placeholder,
                  },
                ]}
              >
                {formatAudioTime(playbackSeconds > 0 ? playbackSeconds : duration)}
              </Text>

              {/* Speed Multiplier Pill */}
              <TouchableOpacity
                onPress={handleCycleSpeed}
                accessibilityLabel={`Playback speed ${playbackSpeed}x`}
                accessibilityRole="button"
                accessibilityHint="Double tap to cycle playback speed between 1x, 1.5x, and 2x"
                style={[
                  styles.vnSpeedPill,
                  {
                    backgroundColor: isCurrentUser
                      ? 'rgba(255, 255, 255, 0.22)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#e2e8f0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.vnSpeedText,
                    {
                      color: isCurrentUser ? '#ffffff' : colors.text,
                    },
                  ]}
                >
                  {playbackSpeed}x
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trailing Mic / Avatar Icon */}
          <View style={styles.vnAvatarCol}>
            <View
              style={[
                styles.vnAvatarPlaceholder,
                {
                  backgroundColor: isCurrentUser
                    ? 'rgba(255, 255, 255, 0.2)'
                    : isDark
                    ? '#27272a'
                    : '#f1f5f9',
                },
              ]}
            >
              <Ionicons
                name="mic"
                size={16}
                color={
                  isCurrentUser
                    ? '#ffffff'
                    : isDark
                    ? '#f4a5b8'
                    : colors.primary
                }
              />
            </View>
          </View>
        </View>

        {/* Message Timestamp & Status Checks */}
        <View style={styles.timeRow}>
          {isStarred && (
            <Ionicons
              name="star"
              size={11}
              color={isCurrentUser ? '#fbbf24' : '#f59e0b'}
              style={{ marginRight: 3 }}
            />
          )}
          <Text
            style={[
              styles.msgTimeText,
              { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.placeholder },
            ]}
          >
            {formatMsgTime(message.sentAt)}
          </Text>

          {isCurrentUser && (
            <Ionicons
              name={
                message.status === 'read'
                  ? 'checkmark-done'
                  : message.status === 'delivered'
                  ? 'checkmark-done-outline'
                  : message.status === 'sending'
                  ? 'time-outline'
                  : message.status === 'error'
                  ? 'alert-circle'
                  : 'checkmark-outline'
              }
              size={14}
              color={
                message.status === 'read'
                  ? '#38bdf8'
                  : message.status === 'error'
                  ? '#ef4444'
                  : 'rgba(255, 255, 255, 0.7)'
              }
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
