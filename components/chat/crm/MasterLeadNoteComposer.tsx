import React from 'react';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './notesStyles';

export interface MasterLeadNoteComposerProps {
  newNoteText: string;
  setNewNoteText: (text: string) => void;
  noteVisibility: 'company_only' | 'company_and_agent';
  setNoteVisibility: (vis: 'company_only' | 'company_and_agent') => void;
  postingNote: boolean;
  handleCreateNote: () => void;
  colors: any;
  isDark: boolean;
}

export default function MasterLeadNoteComposer({
  newNoteText,
  setNewNoteText,
  noteVisibility,
  setNoteVisibility,
  postingNote,
  handleCreateNote,
  colors,
  isDark,
}: MasterLeadNoteComposerProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.composerHeader}>
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
            <Text style={[styles.visibilityChipText, { color: noteVisibility === 'company_and_agent' ? '#10b981' : colors.placeholder }]}>
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
            <Text style={[styles.visibilityChipText, { color: noteVisibility === 'company_only' ? (isDark ? '#f4a5b8' : '#4a0f1f') : colors.placeholder }]}>
              Firm Only
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={[styles.noteInput, { backgroundColor: isDark ? '#1c1c1e' : '#f9fafb', borderColor: colors.border, color: colors.text }]}
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
          style={[styles.postNoteBtn, { backgroundColor: colors.primary, opacity: postingNote || !newNoteText.trim() ? 0.6 : 1 }]}
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
  );
}
