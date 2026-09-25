import React, { useState, useEffect, useCallback } from 'react';
import { View, Modal, FlatList, ActivityIndicator, Platform, Pressable, KeyboardAvoidingView, Alert, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';
import { leadsRepository, InternalNoteItem } from '../../lib/repositories';
import { InternalNotesHeader, InternalNoteCard, InternalNotesEmptyState, InternalNotesComposer, styles } from './internal_notes';
import type { LeadInternalNotesModalProps } from './internal_notes/types';

export type { InternalNoteItem, LeadInternalNotesModalProps };

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
      const result = await leadsRepository.fetchInternalNotes({ inquiryId: inquiryId || resolvedInquiryId, conversationId });
      if (result.inquiryId) setResolvedInquiryId(result.inquiryId);
      setNotes(result.notes);
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
        await leadsRepository.addInternalNote({ inquiryId: activeInqId, authorUserId: currentUser.id, body: text });
      } else {
        Alert.alert('Lead Link Required', 'Internal notes require an associated CRM lead inquiry. Please link this conversation as a lead first.');
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
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoid}>
          <Pressable
            style={[styles.container, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <InternalNotesHeader title={title} isDark={isDark} onClose={onClose} />

            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.placeholder }]}>Loading team notes...</Text>
                </View>
              ) : notes.length === 0 ? (
                <InternalNotesEmptyState isDark={isDark} />
              ) : (
                <FlatList
                  data={notes}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => <InternalNoteCard item={item} isDark={isDark} formatDate={formatDate} />}
                />
              )}
            </View>

            <InternalNotesComposer
              value={newNoteText}
              onChangeText={setNewNoteText}
              onSubmit={handleAddNote}
              isSubmitting={isSubmitting}
              isDark={isDark}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
