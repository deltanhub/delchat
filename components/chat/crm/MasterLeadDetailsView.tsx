import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import Pressable from '../../ScalePressable';
import * as Haptics from '../../../lib/haptics';
import { supabase } from '../../../lib/supabase';
import { leadsRepository } from '../../../lib/repositories/leadsRepository';
import type { ChatConversation } from '../ConversationRow';
import type { ChatMessage } from '../MessageBubble';
import type { MasterLeadSubTab } from './MasterLeadSubHeader';

export interface InternalNoteItem {
  id: string;
  inquiry_id: string;
  author_user_id: string;
  author_name?: string;
  body: string;
  visibility: 'company_only' | 'company_and_agent';
  created_at: string;
}

interface MasterLeadReportItem {
  id: string;
  inquiry_id: string;
  reporter_user_id: string;
  reporter_name?: string;
  reason: string;
  details?: string;
  messages_consent: boolean;
  messages_consent_at?: string;
  report_status: string;
  resolution_note?: string;
  resolved_by_user_id?: string;
  created_at: string;
  resolved_at?: string;
}

interface PublicUserProfile {
  user_id: string;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

interface AssignmentHistoryItem {
  id: string;
  action_kind: string;
  assigned_agent_user_id?: string | null;
  assigned_by_user_id?: string | null;
  note?: string | null;
  created_at: string;
}

interface MasterLeadDetailsViewProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  activeSubTab?: MasterLeadSubTab;
  onOpenInternalNotes?: () => void;
  onNotesCountChange?: (count: number) => void;
  onReportsCountChange?: (count: number) => void;
}

export default function MasterLeadDetailsView({
  conversation,
  messages,
  activeSubTab = 'details',
  onOpenInternalNotes,
  onNotesCountChange,
  onReportsCountChange,
}: MasterLeadDetailsViewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [notes, setNotes] = useState<InternalNoteItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'company_only' | 'company_and_agent'>('company_and_agent');
  const [postingNote, setPostingNote] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [historyProfiles, setHistoryProfiles] = useState<Map<string, PublicUserProfile>>(new Map());
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [reports, setReports] = useState<MasterLeadReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const assignment = conversation.assignment;
  const inquiryId = assignment?.inquiryId || assignment?.leadId;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!inquiryId) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('crm_inquiry_assignment_history')
        .select('id, action_kind, assigned_agent_user_id, assigned_by_user_id, note, created_at')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setHistory(data as AssignmentHistoryItem[]);
        const userIds = Array.from(
          new Set(
            [
              ...data.map((x: AssignmentHistoryItem) => x.assigned_agent_user_id),
              ...data.map((x: AssignmentHistoryItem) => x.assigned_by_user_id),
            ].filter(Boolean) as string[]
          )
        );
        if (userIds.length > 0) {
          const { data: pData } = await supabase.rpc('get_public_user_profiles', {
            requested_user_ids: userIds,
          });
          if (pData) {
            setHistoryProfiles(
              new Map((pData as PublicUserProfile[]).map((p) => [p.user_id, p]))
            );
          }
        }
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.warn('[MasterLeadDetailsView] Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    if (activeSubTab === 'history') {
      void loadHistory();
    }
  }, [activeSubTab, loadHistory]);

  const loadReports = useCallback(async () => {
    if (!inquiryId) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('master_lead_reports')
        .select(
          'id, inquiry_id, reporter_user_id, reason, details, messages_consent, messages_consent_at, report_status, resolution_note, resolved_by_user_id, created_at, resolved_at'
        )
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const reporterIds = Array.from(
          new Set(data.map((r: any) => r.reporter_user_id).filter(Boolean))
        ) as string[];
        let profileMap = new Map<string, PublicUserProfile>();
        if (reporterIds.length > 0) {
          const { data: pData } = await supabase.rpc('get_public_user_profiles', {
            requested_user_ids: reporterIds,
          });
          if (pData) {
            profileMap = new Map(
              (pData as PublicUserProfile[]).map((p) => [p.user_id, p])
            );
          }
        }
        const mappedReports: MasterLeadReportItem[] = data.map((r: any) => {
          const p = profileMap.get(r.reporter_user_id);
          return {
            ...r,
            reporter_name: p?.display_name || p?.full_name || 'Buyer',
          };
        });
        setReports(mappedReports);
        if (onReportsCountChange) onReportsCountChange(mappedReports.length);
      } else {
        setReports([]);
        if (onReportsCountChange) onReportsCountChange(0);
      }
    } catch (err) {
      console.warn('[MasterLeadDetailsView] Error loading reports:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [inquiryId, onReportsCountChange]);

  useEffect(() => {
    if (activeSubTab === 'reports') {
      void loadReports();
    }
  }, [activeSubTab, loadReports]);

  const loadNotes = useCallback(async () => {
    if (!inquiryId && !conversation?.id) return;
    setLoadingNotes(true);
    try {
      const result = await leadsRepository.fetchInternalNotes({
        inquiryId,
        conversationId: conversation?.id,
      });

      const mappedNotes: InternalNoteItem[] = (result.notes || []).map((n) => ({
        id: n.id,
        inquiry_id: n.inquiry_id || n.inquiryId || inquiryId || '',
        author_user_id: n.author_user_id || n.authorUserId || '',
        author_name: n.author_name || n.authorName || 'Team Member',
        body: n.body,
        visibility: (n.visibility || 'company_and_agent') as 'company_only' | 'company_and_agent',
        created_at: n.created_at || n.createdAt || new Date().toISOString(),
      }));

      setNotes(mappedNotes);
      if (onNotesCountChange) onNotesCountChange(mappedNotes.length);
    } catch (err) {
      console.warn('[MasterLeadDetailsView] Error loading notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  }, [inquiryId, conversation?.id, onNotesCountChange]);

  useEffect(() => {
    if (activeSubTab === 'notes') {
      void loadNotes();
    }
  }, [activeSubTab, loadNotes]);

  const handleCreateNote = async () => {
    if (!newNoteText.trim() || !inquiryId || !currentUserId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPostingNote(true);
    try {
      const noteBody = newNoteText.trim();
      const res = await leadsRepository.addInternalNote({
        inquiryId,
        authorUserId: currentUserId,
        body: noteBody,
        visibility: noteVisibility,
      });

      const createdItem: InternalNoteItem = {
        id: res?.id || String(Date.now()),
        inquiry_id: inquiryId,
        author_user_id: currentUserId,
        author_name: 'You',
        body: noteBody,
        visibility: noteVisibility,
        created_at: new Date().toISOString(),
      };
      setNewNoteText('');
      setNotes((prev) => [createdItem, ...prev]);
      if (onNotesCountChange) onNotesCountChange(notes.length + 1);
    } catch (err: any) {
      Alert.alert('Note Error', err.message || 'Failed to post internal note');
    } finally {
      setPostingNote(false);
    }
  };

  const agentUserId = assignment?.agent?.userId || assignment?.assignedAgentUserId;
  const buyerMsgCount = messages.filter((m) => m.senderUserId !== agentUserId).length;
  const agentMsgCount = messages.filter((m) => m.senderUserId === agentUserId).length;
  const firstMsg = messages[messages.length - 1]; // oldest message in inverted feed
  const lastMsg = messages[0]; // newest message in inverted feed

  const firstContactTime = firstMsg
    ? new Date(firstMsg.sentAt).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'None';

  const lastContactTime = lastMsg
    ? new Date(lastMsg.sentAt).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'None';

  // Dynamically compute response time from actual messages
  const buyerFirstMsg = [...messages].reverse().find((m) => m.senderUserId !== agentUserId);
  const agentFirstReply = buyerFirstMsg
    ? [...messages].reverse().find(
        (m) => m.senderUserId === agentUserId && new Date(m.sentAt).getTime() > new Date(buyerFirstMsg.sentAt).getTime()
      )
    : null;

  let responseTimeText = 'Awaiting reply';
  let firstReplySub = 'No agent response yet';

  if (buyerFirstMsg && agentFirstReply) {
    const diffMs = new Date(agentFirstReply.sentAt).getTime() - new Date(buyerFirstMsg.sentAt).getTime();
    const diffMin = Math.max(1, Math.round(diffMs / 60000));
    if (diffMin < 60) {
      responseTimeText = `~ ${diffMin} min`;
      firstReplySub = `First reply: ${diffMin} min`;
    } else if (diffMin < 1440) {
      const hours = Math.round(diffMin / 60);
      responseTimeText = `~ ${hours} hr${hours > 1 ? 's' : ''}`;
      firstReplySub = `First reply: ${hours} hr${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.round(diffMin / 1440);
      responseTimeText = `~ ${days} day${days > 1 ? 's' : ''}`;
      firstReplySub = `First reply: ${days} day${days > 1 ? 's' : ''}`;
    }
  }

  // Render Sub-Tab Views
  if (activeSubTab === 'notes') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Inline Note Composer */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>ADD TEAM NOTE</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setNoteVisibility('company_and_agent')}
                style={[
                  styles.visibilityChip,
                  {
                    backgroundColor: noteVisibility === 'company_and_agent' ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#262626' : '#f3f4f6'),
                    borderColor: noteVisibility === 'company_and_agent' ? '#10b981' : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.visibilityChipText,
                    { color: noteVisibility === 'company_and_agent' ? '#10b981' : colors.placeholder },
                  ]}
                >
                  Firm & Agent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNoteVisibility('company_only')}
                style={[
                  styles.visibilityChip,
                  {
                    backgroundColor: noteVisibility === 'company_only' ? (isDark ? '#2c0810' : '#fdf2f4') : (isDark ? '#262626' : '#f3f4f6'),
                    borderColor: noteVisibility === 'company_only' ? '#4a0f1f' : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.visibilityChipText,
                    { color: noteVisibility === 'company_only' ? (isDark ? '#f4a5b8' : '#4a0f1f') : colors.placeholder },
                  ]}
                >
                  Firm Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: isDark ? '#1c1c1e' : '#f9fafb',
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Add a confidential note about this lead..."
            placeholderTextColor={colors.placeholder}
            value={newNoteText}
            onChangeText={setNewNoteText}
            multiline
            numberOfLines={3}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <TouchableOpacity
              disabled={postingNote || !newNoteText.trim()}
              onPress={handleCreateNote}
              style={[
                styles.postNoteBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: postingNote || !newNoteText.trim() ? 0.6 : 1,
                },
              ]}
            >
              {postingNote ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={13} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.postNoteBtnText}>Save Note</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Handoff Note (if present) */}
        {assignment?.handoffNote ? (
          <View style={[styles.handoffBox, { backgroundColor: isDark ? '#252528' : '#fcf8fa', borderColor: isDark ? '#3f3f46' : '#efe3e8' }]}>
            <Text style={[styles.handoffTitle, { color: colors.primary }]}>🔑 Initial Handoff Note:</Text>
            <Text style={[styles.handoffText, { color: colors.text }]}>"{assignment.handoffNote}"</Text>
            <Text style={[styles.metricSub, { color: colors.placeholder, marginTop: 6 }]}>
              Attached when lead was delegated to {assignment.agent?.fullName || assignment.assignedAgentName || 'Agent'}.
            </Text>
          </View>
        ) : null}

        {/* Notes Stream */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              INTERNAL TEAM NOTES {notes.length > 0 ? `(${notes.length})` : ''}
            </Text>
            {onOpenInternalNotes && (
              <TouchableOpacity onPress={onOpenInternalNotes}>
                <Ionicons name="open-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {loadingNotes ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : notes.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={32} color={colors.placeholder} />
              <Text style={{ fontSize: 13, color: colors.placeholder, marginTop: 6, fontStyle: 'italic' }}>
                No internal notes recorded yet.
              </Text>
            </View>
          ) : (
            notes.map((note) => {
              const initials = (note.author_name || 'TM').substring(0, 2).toUpperCase();
              const isFirmOnly = note.visibility === 'company_only';
              return (
                <View
                  key={note.id}
                  style={[
                    styles.noteItemCard,
                    {
                      backgroundColor: isDark ? '#1c1c1e' : '#fcfdfe',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.noteItemHeader}>
                    <View style={[styles.noteAvatar, { backgroundColor: isDark ? '#3d1624' : '#4a0f1f' }]}>
                      <Text style={styles.noteAvatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.noteAuthorText, { color: colors.text }]}>
                        {note.author_name || 'Team Member'}
                      </Text>
                      <Text style={[styles.noteDateText, { color: colors.placeholder }]}>
                        {new Date(note.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.visibilityBadge,
                        {
                          backgroundColor: isFirmOnly ? (isDark ? '#2c0810' : '#fdf2f4') : (isDark ? '#064e3b' : '#ecfdf5'),
                          borderColor: isFirmOnly ? (isDark ? '#4a0f1f' : '#efe3e8') : '#10b981',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.visibilityBadgeText,
                          { color: isFirmOnly ? (isDark ? '#f4a5b8' : '#4a0f1f') : '#10b981' },
                        ]}
                      >
                        {isFirmOnly ? 'Firm Staff Only' : 'Firm & Agent'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.noteBodyText, { color: colors.text }]}>{note.body}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  }

  if (activeSubTab === 'history') {
    const assignedDate = assignment?.assignedAt
      ? new Date(assignment.assignedAt).toLocaleString([], {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Initial creation';

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            ASSIGNMENT HISTORY {history.length > 0 ? `(${history.length})` : ''}
          </Text>

          {loadingHistory ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : history.length > 0 ? (
            <View style={{ marginTop: 4, paddingLeft: 4 }}>
              {history.map((h, idx) => {
                const agentProfile = historyProfiles.get(h.assigned_agent_user_id || '');
                const byProfile = historyProfiles.get(h.assigned_by_user_id || '');
                const agentName = agentProfile
                  ? (agentProfile.display_name?.trim() || agentProfile.full_name?.trim() || 'Agent')
                  : (assignment?.agent?.fullName || assignment?.assignedAgentName || 'Assigned Agent');
                const byName = byProfile
                  ? (byProfile.display_name?.trim() || byProfile.full_name?.trim() || 'Manager')
                  : (h.assigned_by_user_id === currentUserId ? 'You' : 'Manager');

                let title = '';
                if (h.action_kind === 'assigned' || h.action_kind === 'assign') {
                  title = `Assigned to ${agentName}`;
                } else if (h.action_kind === 'reassigned' || h.action_kind === 'reassign') {
                  title = `Reassigned to ${agentName}`;
                } else if (h.action_kind === 'status_changed') {
                  title = 'Status updated';
                } else {
                  title = 'Assignment removed';
                }

                const isLast = idx === history.length - 1;

                return (
                  <View key={h.id} style={styles.timelineItemRow}>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineConnector,
                          { backgroundColor: isDark ? '#3d1624' : '#efe3e8' },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: colors.primary, borderColor: colors.card },
                      ]}
                    />
                    <View style={{ flex: 1, paddingBottom: 16 }}>
                      <Text style={[styles.metricSub, { color: colors.placeholder, fontSize: 11 }]}>
                        {new Date(h.created_at).toLocaleString([], {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={[styles.dataValue, { color: colors.text, fontWeight: '600', marginTop: 2 }]}>
                        {title}
                      </Text>
                      <Text style={[styles.metricSub, { color: colors.placeholder, marginTop: 2 }]}>
                        by {byName} {h.note ? `· note: "${h.note}"` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : assignment?.agent || assignment?.assignedAgentName ? (
            <View style={styles.historyItem}>
              <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataValue, { color: colors.text }]}>
                  {`Assigned to ${assignment.agent?.fullName || assignment.assignedAgentName}`}
                </Text>
                <Text style={[styles.metricSub, { color: colors.placeholder }]}>{assignedDate}</Text>
                {assignment?.handoffNote && (
                  <Text style={[styles.handoffText, { color: colors.placeholder, marginTop: 4 }]}>
                    Note: "{assignment.handoffNote}"
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Ionicons name="time-outline" size={32} color={colors.placeholder} />
              <Text style={{ fontSize: 13, color: colors.placeholder, marginTop: 6, fontStyle: 'italic' }}>
                No assignment logs found.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  if (activeSubTab === 'reports') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
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
            <Ionicons name="shield-checkmark" size={14} color={isDark ? '#f4a5b8' : '#4a0f1f'} />
            <Text style={[styles.privacyTitle, { color: isDark ? '#f4a5b8' : '#4a0f1f' }]}>
              Moderation & Buyer Reports
            </Text>
          </View>
          <Text style={[styles.privacyText, { color: isDark ? '#e5e7eb' : '#5f5360' }]}>
            Buyer-reported issues appear here. When a buyer files a report and grants consent, the company can read that
            thread for the duration needed to resolve the report. All access is audit-logged.
          </Text>
        </View>

        {loadingReports ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : reports.length > 0 ? (
          reports.map((r) => {
            const isPending = r.report_status === 'pending';
            return (
              <View
                key={r.id}
                style={[
                  styles.reportCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderLeftColor: isPending ? '#a4243b' : '#10b981',
                  },
                ]}
              >
                <View style={styles.reportCardHeader}>
                  <Text style={[styles.reportStatusBadge, { color: isPending ? '#a4243b' : '#10b981' }]}>
                    Buyer report · {r.report_status.toUpperCase()}
                  </Text>
                  <Text style={[styles.reportDateText, { color: colors.placeholder }]}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.reportDetails}>
                  <Text style={[styles.reportFieldText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '700' }}>Reason: </Text>
                    {r.reason}
                  </Text>
                  {r.details ? (
                    <Text style={[styles.reportFieldText, { color: colors.text, marginTop: 4 }]}>
                      <Text style={{ fontWeight: '700' }}>Details: </Text>
                      {r.details}
                    </Text>
                  ) : null}
                  <Text style={[styles.reportFieldText, { color: colors.text, marginTop: 4 }]}>
                    <Text style={{ fontWeight: '700' }}>Reported by: </Text>
                    {r.reporter_name || 'Buyer'}
                  </Text>
                  <Text style={[styles.reportFieldText, { color: colors.text, marginTop: 4 }]}>
                    <Text style={{ fontWeight: '700' }}>Consent given: </Text>
                    {r.messages_consent ? '✅ Yes — company may read messages to resolve' : '❌ No'}
                  </Text>
                  {r.resolution_note ? (
                    <Text
                      style={[
                        styles.reportFieldText,
                        { color: colors.placeholder, marginTop: 6, fontStyle: 'italic' },
                      ]}
                    >
                      Resolution: {r.resolution_note}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                alignItems: 'center',
                paddingVertical: 24,
              },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={36} color="#10b981" />
            <Text style={[styles.cardTitle, { color: colors.text, marginTop: 8 }]}>NO ACTIVE REPORTS</Text>
            <Text style={[styles.metricSub, { color: colors.placeholder, textAlign: 'center', maxWidth: 260 }]}>
              This conversation is in good standing with zero moderation flags.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  if (activeSubTab === 'activity') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>ACTIVITY TIMELINE</Text>
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Total Messages</Text>
            <Text style={[styles.dataValue, { color: colors.text }]}>{messages.length}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Buyer Inquiries</Text>
            <Text style={[styles.dataValue, { color: colors.text }]}>{buyerMsgCount}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Agent Responses</Text>
            <Text style={[styles.dataValue, { color: colors.text }]}>{agentMsgCount}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.placeholder }]}>Current Stage</Text>
            <Text style={[styles.dataValue, { color: colors.primary, fontWeight: '700' }]}>
              {(assignment?.masterLeadStatus || assignment?.status || 'New').toUpperCase()}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Default: 'details' (Lead Summary)
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
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>MESSAGES</Text>
          <Text style={[styles.metricBigValue, { color: colors.text }]}>{messages.length}</Text>
          <Text style={[styles.metricSub, { color: colors.placeholder }]}>
            Buyer {buyerMsgCount} · Agent {agentMsgCount}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>LAST MESSAGE</Text>
          <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
            {lastContactTime}
          </Text>
          <Text style={[styles.metricSub, { color: colors.placeholder }]}>
            {lastMsg?.senderUserId === agentUserId ? 'By assigned agent' : 'By buyer'}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>FIRST CONTACT</Text>
          <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
            {firstContactTime}
          </Text>
          <Text style={[styles.metricSub, { color: colors.placeholder }]}>
            Intent: {(conversation.latestIntent || 'Tour request').toUpperCase()}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.placeholder }]}>RESPONSE TIME</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{responseTimeText}</Text>
          <Text style={[styles.metricSub, { color: colors.placeholder }]}>{firstReplySub}</Text>
        </View>
      </View>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  privacyBox: { padding: 12, borderRadius: 10, borderWidth: 1 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  privacyTitle: { fontSize: 13, fontWeight: '700', fontFamily: Typography.fontFamily },
  privacyText: { fontSize: 12, fontFamily: Typography.fontFamily, lineHeight: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', padding: 12, borderRadius: 10, borderWidth: 1 },
  metricLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  metricBigValue: { fontSize: 24, fontWeight: '700', fontFamily: Typography.fontFamily },
  metricValue: { fontSize: 14, fontWeight: '600', fontFamily: Typography.fontFamily, marginTop: 4 },
  metricSub: { fontSize: 11, marginTop: 4, fontFamily: Typography.fontFamily },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  propertyImgWrap: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  propertyImg: { width: '100%', height: '100%' },
  propertyName: { fontSize: 14, fontWeight: '600', fontFamily: Typography.fontFamily },
  propertySubtitle: { fontSize: 12, fontFamily: Typography.fontFamily, marginTop: 2 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  dataLabel: { fontSize: 13, fontFamily: Typography.fontFamily },
  dataValue: { fontSize: 13, fontWeight: '500', fontFamily: Typography.fontFamily },
  handoffBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 6 },
  handoffTitle: { fontSize: 12, fontWeight: '700', fontFamily: Typography.fontFamily, marginBottom: 4 },
  handoffText: { fontSize: 13, fontFamily: Typography.fontFamily, fontStyle: 'italic', lineHeight: 18 },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  timelineItemRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingLeft: 22,
  },
  timelineConnector: {
    position: 'absolute',
    left: 4,
    top: 14,
    bottom: 0,
    width: 2,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  visibilityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  visibilityChipText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    minHeight: 64,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  postNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  postNoteBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  noteItemCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  noteItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteAvatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  noteAuthorText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  noteDateText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
  },
  visibilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  visibilityBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  noteBodyText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: Typography.fontFamily,
  },
  reportCard: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportStatusBadge: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  reportDateText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily,
  },
  reportDetails: {
    marginTop: 2,
  },
  reportFieldText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: Typography.fontFamily,
  },
});
