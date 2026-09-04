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
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';

export interface InternalNoteItem {
  id: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface LeadInternalNotesModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId?: string;
  inquiryId?: string | null;
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LeadInternalNotesModal({
  visible,
  onClose,
  conversationId = '',
  inquiryId,
  title = 'Internal Team Notes',
}: LeadInternalNotesModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [notes, setNotes] = useState<InternalNoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedInquiryId, setResolvedInquiryId] = useState<string | null>(inquiryId || null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      let activeInqId = inquiryId || resolvedInquiryId;

      // 1. If no inquiryId provided, attempt to resolve from conversation_id
      if (!activeInqId && conversationId) {
        const { data: inqRow } = await supabase
          .from('crm_inquiries')
          .select('id')
          .eq('conversation_id', conversationId)
          .maybeSingle();

        if (inqRow) {
          activeInqId = inqRow.id;
          setResolvedInquiryId(inqRow.id);
        }
      }

      // 2. Primary: Query master_lead_internal_notes if inquiryId exists
      if (activeInqId) {
        const { data: noteRows, error: noteErr } = await supabase
          .from('master_lead_internal_notes')
          .select('id, author_user_id, body, created_at')
          .eq('inquiry_id', activeInqId)
          .order('created_at', { ascending: false });

        if (!noteErr && noteRows && noteRows.length > 0) {
          // Resolve author names
          const authorIds = Array.from(new Set(noteRows.map((n: any) => n.author_user_id)));
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, display_name, full_name')
            .in('user_id', authorIds);

          const nameMap = new Map(
            (profiles || []).map((p: any) => [p.user_id, p.display_name || p.full_name || 'Agent'])
          );

          const mapped: InternalNoteItem[] = noteRows.map((n: any) => ({
            id: n.id,
            authorUserId: n.author_user_id,
            authorName: nameMap.get(n.author_user_id) || 'Team Member',
            body: n.body,
            createdAt: n.created_at,
          }));
          setNotes(mapped);
          return;
        }
      }

      // 3. Fallback: Query chat_messages where intent = 'internal_note'
      const { data: msgRows, error: msgErr } = await supabase
        .from('chat_messages')
        .select('id, sender_user_id, body, created_at')
        .eq('conversation_id', conversationId)
        .eq('intent', 'internal_note')
        .order('created_at', { ascending: false });

      if (!msgErr && msgRows) {
        const authorIds = Array.from(new Set(msgRows.map((m: any) => m.sender_user_id).filter(Boolean)));
        let nameMap = new Map<string, string>();
        if (authorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, display_name, full_name')
            .in('user_id', authorIds);
          (profiles || []).forEach((p: any) => {
            nameMap.set(p.user_id, p.display_name || p.full_name || 'Agent');
          });
        }

        const mapped: InternalNoteItem[] = msgRows.map((m: any) => ({
          id: m.id,
          authorUserId: m.sender_user_id,
          authorName: nameMap.get(m.sender_user_id) || 'Team Member',
          body: m.body,
          createdAt: m.created_at,
        }));
        setNotes(mapped);
      }
    } catch (err) {
      console.warn('[LeadInternalNotesModal] Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, inquiryId, resolvedInquiryId]);

  useEffect(() => {
    if (visible) {
      fetchNotes();
      setNewNoteText('');
    }
  }, [visible, fetchNotes]);

  const handleAddNote = async () => {
    const text = newNoteText.trim();
    if (!text) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) return;

      const optimisticNote: InternalNoteItem = {
        id: `temp-${Date.now()}`,
        authorUserId: currentUser.id,
        authorName: 'You',
        body: text,
        createdAt: new Date().toISOString(),
      };

      setNotes((prev) => [optimisticNote, ...prev]);
      setNewNoteText('');

      const activeInqId = inquiryId || resolvedInquiryId;

      if (activeInqId) {
        const { error: insertErr } = await supabase.from('master_lead_internal_notes').insert({
          inquiry_id: activeInqId,
          author_user_id: currentUser.id,
          body: text,
          visibility: 'company_and_agent',
        });

        if (insertErr) {
          throw insertErr;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      } else {
        Alert.alert(
          'Lead Link Required',
          'Internal notes require an associated CRM lead inquiry. Please link this conversation as a lead first.'
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.warn('[LeadInternalNotesModal] Error adding note:', err);
      Alert.alert('Error', err?.message || 'Unable to save internal note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], {
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Pressable
            style={[
              styles.container,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.badgeIcon, { backgroundColor: isDark ? '#382006' : '#fef3c7' }]}>
                  <Ionicons name="lock-closed" size={18} color="#f59e0b" />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.subTitle, { color: '#f59e0b' }]}>STAFF ONLY</Text>
                    <View style={styles.privatePill}>
                      <Text style={styles.privatePillText}>Invisible to Client</Text>
                    </View>
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#262626' : '#f3f4f6' }]}
                accessibilityRole="button"
                accessibilityLabel="Close internal notes"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Notes Feed */}
            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.placeholder }]}>
                    Loading team notes...
                  </Text>
                </View>
              ) : notes.length === 0 ? (
                <View style={styles.centerContainer}>
                  <View style={[styles.emptyLockCircle, { backgroundColor: isDark ? '#382006' : '#fef3c7' }]}>
                    <Ionicons name="lock-closed" size={32} color="#f59e0b" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Internal Notes</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                    Notes added here are strictly private to licensed brokerage staff. The client will never see these messages.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={notes}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.noteCard,
                        {
                          backgroundColor: isDark ? '#1c1917' : '#fffbeb',
                          borderColor: isDark ? '#442807' : '#fef08a',
                        },
                      ]}
                    >
                      <View style={styles.noteTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="shield-checkmark" size={14} color="#f59e0b" />
                          <Text style={[styles.authorName, { color: isDark ? '#fef3c7' : '#78350f' }]}>
                            {item.authorName}
                          </Text>
                        </View>
                        <Text style={[styles.dateText, { color: colors.placeholder }]}>
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.noteBody, { color: isDark ? '#f5f5f4' : '#1c1917' }]}>
                        {item.body}
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>

            {/* Composer */}
            <View style={[styles.composerContainer, { borderTopColor: colors.border, backgroundColor: isDark ? '#140509' : '#fcfdfd' }]}>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  value={newNoteText}
                  onChangeText={setNewNoteText}
                  placeholder="Add confidential team note..."
                  placeholderTextColor={colors.placeholder}
                  style={[styles.input, { color: colors.text }]}
                  multiline
                  maxLength={500}
                />
                <ScalePressable
                  onPress={handleAddNote}
                  disabled={isSubmitting || !newNoteText.trim()}
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: newNoteText.trim() ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Submit internal note"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="arrow-up" size={18} color="#ffffff" />
                  )}
                </ScalePressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    justifyContent: 'flex-end',
  },
  container: {
    height: SCREEN_HEIGHT * 0.85,
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
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  privatePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  privatePillText: {
    color: '#92400e',
    fontSize: 9,
    fontWeight: '700',
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
  emptyLockCircle: {
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
    maxWidth: 280,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  composerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 90,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
