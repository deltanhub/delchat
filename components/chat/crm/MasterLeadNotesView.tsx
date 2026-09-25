import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './notesStyles';
import MasterLeadNoteComposer from './MasterLeadNoteComposer';
import type { InternalNoteItem } from './types';

export interface MasterLeadNotesViewProps {
  notes: InternalNoteItem[];
  loadingNotes: boolean;
  newNoteText: string;
  setNewNoteText: (text: string) => void;
  noteVisibility: 'company_only' | 'company_and_agent';
  setNoteVisibility: (vis: 'company_only' | 'company_and_agent') => void;
  postingNote: boolean;
  handleCreateNote: () => void;
  handoffNote?: string | null;
  assignedAgentName?: string | null;
  onOpenInternalNotes?: () => void;
  colors: any;
  isDark: boolean;
}

export default function MasterLeadNotesView({
  notes, loadingNotes, newNoteText, setNewNoteText,
  noteVisibility, setNoteVisibility, postingNote, handleCreateNote,
  handoffNote, assignedAgentName, onOpenInternalNotes, colors, isDark,
}: MasterLeadNotesViewProps) {
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Inline Note Composer */}
      <MasterLeadNoteComposer
        newNoteText={newNoteText}
        setNewNoteText={setNewNoteText}
        noteVisibility={noteVisibility}
        setNoteVisibility={setNoteVisibility}
        postingNote={postingNote}
        handleCreateNote={handleCreateNote}
        colors={colors}
        isDark={isDark}
      />

      {/* Handoff Note */}
      {handoffNote ? (
        <View style={[styles.handoffBox, { backgroundColor: isDark ? '#252528' : '#fcf8fa', borderColor: isDark ? '#3f3f46' : '#efe3e8' }]}>
          <Text style={[styles.handoffTitle, { color: colors.primary }]}>🔑 Initial Handoff Note:</Text>
          <Text style={[styles.handoffText, { color: colors.text }]}>"{handoffNote}"</Text>
          <Text style={[styles.metricSub, { color: colors.placeholder, marginTop: 6 }]}>
            Attached when lead was delegated to {assignedAgentName || 'Agent'}.
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
              <View key={note.id} style={[styles.noteItemCard, { backgroundColor: isDark ? '#1c1c1e' : '#fcfdfe', borderColor: colors.border }]}>
                <View style={styles.noteItemHeader}>
                  <View style={[styles.noteAvatar, { backgroundColor: isDark ? '#3d1624' : '#4a0f1f' }]}>
                    <Text style={styles.noteAvatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.noteAuthorText, { color: colors.text }]}>{note.author_name || 'Team Member'}</Text>
                    <Text style={[styles.noteDateText, { color: colors.placeholder }]}>
                      {new Date(note.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                    <Text style={[styles.visibilityBadgeText, { color: isFirmOnly ? (isDark ? '#f4a5b8' : '#4a0f1f') : '#10b981' }]}>
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
