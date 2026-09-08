import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';

export interface StarredMessageItem {
  starredId: string;
  starredAt: string;
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  conversationKind?: string;
  senderUserId: string | null;
  senderName: string;
  senderType: string;
  messageKind: string;
  body: string;
  intent?: string | null;
  structuredPayload?: Record<string, any> | null;
  createdAt: string;
  attachments?: Array<{
    id: string;
    kind: string;
    originalName?: string;
    name?: string;
    sizeBytes?: number;
    mimeType?: string;
    storagePath?: string;
  }>;
}

interface StarredMessagesModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId?: string | null;
  conversationTitle?: string | null;
  onJumpToMessage?: (messageId: string, conversationId?: string) => void;
  onUnstarMessage?: (messageId: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StarredMessagesModal({
  visible,
  onClose,
  conversationId,
  conversationTitle,
  onJumpToMessage,
  onUnstarMessage,
}: StarredMessagesModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [scope, setScope] = useState<'current' | 'all'>(conversationId ? 'current' : 'all');
  const [messages, setMessages] = useState<StarredMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync scope if conversationId changes
  useEffect(() => {
    if (conversationId) {
      setScope('current');
    } else {
      setScope('all');
    }
  }, [conversationId]);

  const fetchStarredMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeConvId = scope === 'current' && conversationId ? conversationId : null;

      // Primary: High-performance atomic RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_user_starred_messages',
        {
          p_conversation_id: activeConvId,
          p_limit: 50,
          p_offset: 0,
        }
      );

      if (!rpcError && Array.isArray(rpcData)) {
        const mapped: StarredMessageItem[] = rpcData.map((r: any) => ({
          starredId: r.starred_id || r.id,
          starredAt: r.starred_at || r.created_at,
          messageId: r.message_id,
          conversationId: r.conversation_id,
          conversationTitle: r.conversation_title || 'Chat',
          conversationKind: r.conversation_kind || 'direct',
          senderUserId: r.sender_user_id,
          senderName: r.sender_name || 'Member',
          senderType: r.sender_type || 'user',
          messageKind: r.message_kind || 'text',
          body: r.body || '',
          intent: r.intent || null,
          structuredPayload: r.structured_payload || null,
          createdAt: r.created_at,
          attachments: r.attachments || [],
        }));
        setMessages(mapped);
        return;
      }

      // Fallback: Direct table join query
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('chat_starred_messages')
        .select(`
          id,
          created_at,
          message_id,
          message:chat_messages (
            id,
            conversation_id,
            sender_user_id,
            sender_type,
            message_kind,
            body,
            intent,
            structured_payload,
            created_at,
            conversation:chat_conversations (
              id,
              conversation_kind,
              title,
              context_snapshot
            ),
            attachments:chat_message_attachments (
              id,
              attachment_kind,
              original_name,
              mime_type,
              size_bytes,
              storage_path
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: fallbackRows, error: fallbackError } = await query;
      if (fallbackError) throw fallbackError;

      if (fallbackRows) {
        let filteredRows = fallbackRows;
        if (activeConvId) {
          filteredRows = fallbackRows.filter((r: any) => r.message?.conversation_id === activeConvId);
        }

        const mapped: StarredMessageItem[] = filteredRows
          .filter((r: any) => r.message)
          .map((r: any) => {
            const m = r.message;
            const conv = m.conversation;
            const convTitle = conv?.title || conv?.context_snapshot?.title || 'Chat';
            return {
              starredId: r.id,
              starredAt: r.created_at,
              messageId: m.id,
              conversationId: m.conversation_id,
              conversationTitle: convTitle,
              conversationKind: conv?.conversation_kind || 'direct',
              senderUserId: m.sender_user_id,
              senderName: m.sender_type === 'assistant' ? 'Deltan AI' : 'Member',
              senderType: m.sender_type || 'user',
              messageKind: m.message_kind || 'text',
              body: m.body || '',
              intent: m.intent || null,
              structuredPayload: m.structured_payload || null,
              createdAt: m.created_at,
              attachments: m.attachments || [],
            };
          });
        setMessages(mapped);
      }
    } catch (err: any) {
      console.warn('[StarredMessagesModal] Error fetching starred messages:', err);
      setError(err?.message || 'Unable to load starred messages.');
    } finally {
      setLoading(false);
    }
  }, [scope, conversationId]);

  useEffect(() => {
    if (visible) {
      fetchStarredMessages();
      setSearchQuery('');
    }
  }, [visible, fetchStarredMessages]);

  const handleUnstar = async (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Optimistic removal from current list
    setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
    onUnstarMessage?.(messageId);

    try {
      const { error: rpcErr } = await supabase.rpc('toggle_chat_message_star', {
        p_message_id: messageId,
      });

      if (rpcErr) {
        // Fallback delete
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase
            .from('chat_starred_messages')
            .delete()
            .eq('user_id', authData.user.id)
            .eq('message_id', messageId);
        }
      }
    } catch (err) {
      console.warn('[StarredMessagesModal] Failed to unstar message:', err);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!visible) return null;

  const filteredMessages = messages.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const bodyMatch = item.body?.toLowerCase().includes(q);
    const senderMatch = item.senderName?.toLowerCase().includes(q);
    const convMatch = item.conversationTitle?.toLowerCase().includes(q);
    return bodyMatch || senderMatch || convMatch;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Drag Indicator */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.starBadge, { backgroundColor: isDark ? '#3d2508' : '#fef3c7' }]}>
                <Ionicons name="star" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={[styles.favoritesSub, { color: colors.primary }]}>FAVORITES</Text>
                <Text style={[styles.title, { color: colors.text }]}>Starred Messages</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#262626' : '#f3f4f6' }]}
              accessibilityRole="button"
              accessibilityLabel="Close starred messages"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Scope Selector (if conversationId provided) */}
          {conversationId && (
            <View style={[styles.scopeContainer, { borderBottomColor: colors.border, backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}>
              <View style={[styles.scopeToggle, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScope('current');
                  }}
                  style={[
                    styles.scopeButton,
                    scope === 'current' && [
                      styles.scopeButtonActive,
                      {
                        backgroundColor: isDark ? '#4a0f1f' : colors.card,
                        borderColor: isDark ? '#6e1a30' : 'transparent',
                        borderWidth: isDark ? 1 : 0,
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.scopeText,
                      {
                        color: scope === 'current'
                          ? (isDark ? '#ffffff' : colors.primary)
                          : (isDark ? '#e2e8f0' : colors.placeholder),
                        fontWeight: scope === 'current' ? '700' : '500',
                      },
                    ]}
                  >
                    In this chat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScope('all');
                  }}
                  style={[
                    styles.scopeButton,
                    scope === 'all' && [
                      styles.scopeButtonActive,
                      {
                        backgroundColor: isDark ? '#4a0f1f' : colors.card,
                        borderColor: isDark ? '#6e1a30' : 'transparent',
                        borderWidth: isDark ? 1 : 0,
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.scopeText,
                      {
                        color: scope === 'all'
                          ? (isDark ? '#ffffff' : colors.primary)
                          : (isDark ? '#e2e8f0' : colors.placeholder),
                        fontWeight: scope === 'all' ? '700' : '500',
                      },
                    ]}
                  >
                    All chats
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Search Box */}
          <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: isDark ? '#1e1e1e' : '#f1f5f9', borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={17} color={colors.placeholder} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search starred messages or senders..."
                placeholderTextColor={colors.placeholder}
                style={[styles.searchInput, { color: colors.text }]}
                clearButtonMode="while-editing"
                accessibilityLabel="Search starred messages"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={17} color={colors.placeholder} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.placeholder }]}>
                Loading starred messages...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={44} color="#ef4444" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load</Text>
              <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>{error}</Text>
              <TouchableOpacity
                onPress={fetchStarredMessages}
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredMessages.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={[styles.emptyStarCircle, { backgroundColor: isDark ? '#3d2508' : '#fef3c7' }]}>
                <Ionicons name="star" size={32} color="#f59e0b" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No starred messages</Text>
              <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                {searchQuery
                  ? 'No starred messages matched your search query.'
                  : scope === 'current'
                  ? "You haven't starred any messages in this chat yet."
                  : 'Star important messages in any chat to find them easily here.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMessages}
              keyExtractor={(item) => item.starredId}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#e4e4e7',
                    },
                  ]}
                >
                  {/* Top Row: Sender, Conversation Title, Date, Unstar Button */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.senderInfo}>
                      <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
                        {item.senderName}
                      </Text>
                      {scope === 'all' && (
                        <Text style={[styles.conversationTitle, { color: colors.placeholder }]} numberOfLines={1}>
                          {item.conversationTitle}
                        </Text>
                      )}
                    </View>

                    <View style={styles.cardActions}>
                      <Text style={[styles.dateText, { color: colors.placeholder }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleUnstar(item.messageId)}
                        style={styles.unstarBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Unstar message"
                        accessibilityHint="Removes this message from your favorites"
                      >
                        <Ionicons name="star" size={17} color="#f59e0b" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Message Body / Content Preview */}
                  <View style={styles.cardBody}>
                    {item.body ? (
                      <Text style={[styles.bodyText, { color: colors.text }]} numberOfLines={4}>
                        {item.body}
                      </Text>
                    ) : null}

                    {/* Attachment / Rich Media Badges */}
                    {item.messageKind === 'listing_card' ? (
                      <View style={[styles.mediaBadge, { backgroundColor: isDark ? '#27272a' : '#f4e7eb' }]}>
                        <Ionicons name="home" size={15} color={colors.primary} />
                        <Text style={[styles.mediaBadgeText, { color: colors.primary }]} numberOfLines={1}>
                          Property Listing Card
                        </Text>
                      </View>
                    ) : item.messageKind === 'voice_note' ? (
                      <View style={[styles.mediaBadge, { backgroundColor: isDark ? '#27272a' : '#f0fdf4' }]}>
                        <Ionicons name="mic" size={15} color="#16a34a" />
                        <Text style={[styles.mediaBadgeText, { color: '#16a34a' }]} numberOfLines={1}>
                          Voice Recording
                        </Text>
                      </View>
                    ) : item.messageKind === 'inquiry_form' || item.messageKind === 'inquiry_response' ? (
                      <View style={[styles.mediaBadge, { backgroundColor: isDark ? '#27272a' : '#eff6ff' }]}>
                        <Ionicons name="document-text" size={15} color="#2563eb" />
                        <Text style={[styles.mediaBadgeText, { color: '#2563eb' }]} numberOfLines={1}>
                          Inquiry Questionnaire
                        </Text>
                      </View>
                    ) : item.attachments && item.attachments.length > 0 ? (
                      <View style={[styles.mediaBadge, { backgroundColor: isDark ? '#27272a' : '#f4f4f5' }]}>
                        <Ionicons
                          name={
                            item.attachments[0].kind === 'video'
                              ? 'videocam'
                              : item.attachments[0].kind === 'audio'
                              ? 'musical-notes'
                              : 'document-attach'
                          }
                          size={15}
                          color={colors.placeholder}
                        />
                        <Text style={[styles.mediaBadgeText, { color: colors.placeholder }]} numberOfLines={1}>
                          {item.attachments[0].originalName || item.attachments[0].name || 'Attachment file'}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Jump To Chat Action */}
                  <View style={styles.cardFooter}>
                    <ScalePressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onClose();
                        onJumpToMessage?.(item.messageId, item.conversationId);
                      }}
                      style={[
                        styles.jumpBtn,
                        { backgroundColor: isDark ? '#27272a' : '#f4e7eb' },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Jump to message in conversation"
                    >
                      <Text style={[styles.jumpBtnText, { color: colors.primary }]}>
                        Jump to chat
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                    </ScalePressable>
                  </View>
                </View>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    height: SCREEN_HEIGHT * 0.88,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritesSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scopeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeButtonActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scopeText: {
    fontSize: 13,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
  },
  conversationTitle: {
    fontSize: 12,
    marginTop: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
  },
  unstarBtn: {
    padding: 4,
  },
  cardBody: {
    marginTop: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
  },
  mediaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  jumpBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
