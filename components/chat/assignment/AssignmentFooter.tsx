import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';

export interface AssignmentFooterProps {
  handoffNote: string;
  setHandoffNote: (note: string) => void;
  currentAssignedAgentId?: string | null;
  selectedAgentId?: string | null;
  selectedAgentName?: string | null;
  isSubmitting: boolean;
  colors: any;
  isDark: boolean;
  bottomInset: number;
  onAssign: () => void;
  onUnassign: () => void;
}

export default function AssignmentFooter({
  handoffNote,
  setHandoffNote,
  currentAssignedAgentId,
  selectedAgentId,
  selectedAgentName,
  isSubmitting,
  colors,
  isDark,
  bottomInset,
  onAssign,
  onUnassign,
}: AssignmentFooterProps) {
  return (
    <View
      style={[
        styles.footer,
        {
          borderTopColor: colors.border,
          backgroundColor: isDark ? '#140509' : '#fbfcfd',
          paddingBottom: Math.max(bottomInset, 16) + 6,
        },
      ]}
    >
      <Text style={[styles.noteLabel, { color: colors.placeholder }]}>
        INTERNAL HANDOFF NOTE (OPTIONAL)
      </Text>
      <TextInput
        value={handoffNote}
        onChangeText={setHandoffNote}
        placeholder="E.g. Client verified budget N200M, prefers weekend viewings..."
        placeholderTextColor={colors.placeholder}
        style={[
          styles.noteInput,
          {
            backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        multiline
        maxLength={300}
      />

      <View style={styles.buttonRow}>
        {currentAssignedAgentId ? (
          <TouchableOpacity
            onPress={onUnassign}
            disabled={isSubmitting}
            style={[styles.unassignBtn, { borderColor: '#ef4444' }]}
            accessibilityRole="button"
            accessibilityLabel="Unassign lead"
          >
            <Text style={styles.unassignBtnText}>Unassign</Text>
          </TouchableOpacity>
        ) : null}

        {!selectedAgentId ? (
          <View
            style={[
              styles.assignBtn,
              {
                backgroundColor: isDark ? 'rgba(74, 15, 31, 0.20)' : '#fcedf2',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(140, 65, 84, 0.45)' : '#fed7dd',
                flex: 1,
              },
            ]}
          >
            <Ionicons name="person-add-outline" size={17} color={isDark ? '#f4a6b7' : '#9f1239'} />
            <Text style={[styles.assignBtnText, { color: isDark ? '#f4a6b7' : '#9f1239', fontWeight: '600' }]}>
              Select an Agent to Assign
            </Text>
          </View>
        ) : (
          <ScalePressable
            onPress={onAssign}
            disabled={isSubmitting}
            style={[styles.assignBtn, { backgroundColor: colors.primary, flex: 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Confirm assignment"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={[styles.assignBtnText, { color: '#ffffff', fontWeight: '700' }]}>
                  {currentAssignedAgentId ? 'Reassign Lead' : `Assign to ${selectedAgentName || 'Agent'}`}
                </Text>
              </>
            )}
          </ScalePressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  noteLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  noteInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, minHeight: 48, maxHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unassignBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  unassignBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  assignBtnText: { fontSize: 14 },
});
