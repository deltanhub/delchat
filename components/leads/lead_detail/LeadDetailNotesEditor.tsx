import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './styles';
import { LeadDetailNotesEditorProps } from './types';

export const LeadDetailNotesEditor: React.FC<LeadDetailNotesEditorProps> = ({
  notesText,
  onChangeNotesText,
  onSaveNotes,
  isSavingNotes,
  textColor,
  placeholderColor,
  borderColor,
  primaryColor,
  isDark,
}) => {
  return (
    <View
      style={[
        styles.detailSectionCard,
        { backgroundColor: isDark ? '#262626' : '#f8fafc', borderColor },
      ]}
    >
      <Text style={[styles.detailSectionTitle, { color: textColor }]}>Internal Notes</Text>
      <TextInput
        value={notesText}
        onChangeText={onChangeNotesText}
        placeholder="Add follow-up notes, client preferences..."
        placeholderTextColor={placeholderColor}
        multiline
        numberOfLines={4}
        style={[styles.notesInput, { color: textColor }]}
      />
      <TouchableOpacity
        disabled={isSavingNotes}
        onPress={onSaveNotes}
        style={[styles.saveNoteBtn, { backgroundColor: primaryColor }]}
      >
        {isSavingNotes ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.saveNoteBtnText}>Save Notes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
