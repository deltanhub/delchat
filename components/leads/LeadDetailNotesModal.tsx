import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';
import { ManualLeadItem, MANUAL_LEAD_STATUS_OPTIONS } from './types';

interface LeadDetailNotesModalProps {
  visible: boolean;
  onClose: () => void;
  lead: ManualLeadItem | null;
  onUpdateStatus: (nextStatus: ManualLeadItem['status']) => void;
  onSaveNotes: (notes: string) => Promise<void>;
  isSavingNotes: boolean;
}

export default function LeadDetailNotesModal({
  visible,
  onClose,
  lead,
  onUpdateStatus,
  onSaveNotes,
  isSavingNotes,
}: LeadDetailNotesModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    if (lead) {
      setNotesText(lead.notes || '');
    }
  }, [lead]);

  if (!lead) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Lead Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.detailLeadName, { color: colors.text }]}>{lead.contactName}</Text>
            <Text style={[styles.detailLeadSource, { color: colors.placeholder }]}>Source: {lead.source}</Text>

            {/* Direct Contact Actions Row: Call, Email, WhatsApp */}
            <View style={styles.quickActionsRow}>
              {lead.contactPhone && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`tel:${lead.contactPhone}`);
                  }}
                  style={[styles.quickActionBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                >
                  <Ionicons name="call" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>Call</Text>
                </TouchableOpacity>
              )}

              {lead.contactEmail && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`mailto:${lead.contactEmail}`);
                  }}
                  style={[styles.quickActionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                >
                  <Ionicons name="mail" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb' }}>Email</Text>
                </TouchableOpacity>
              )}

              {lead.contactPhone && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const clean = lead.contactPhone!.replace(/[^0-9]/g, '');
                    Linking.openURL(`https://wa.me/${clean}`);
                  }}
                  style={[styles.quickActionBtn, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#16a34a" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a' }}>WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Property Interest Card */}
            <View
              style={[
                styles.detailSectionCard,
                { backgroundColor: isDark ? '#262626' : '#f8fafc', borderColor: colors.border },
              ]}
            >
              <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Property Requirements</Text>
              <Text style={[styles.detailSectionRow, { color: colors.text }]}>
                Type: <Text style={{ fontWeight: '700' }}>{lead.propertyType || 'Any'}</Text>
              </Text>
              <Text style={[styles.detailSectionRow, { color: colors.text }]}>
                Status: <Text style={{ fontWeight: '700' }}>{lead.propertyStatus || 'Any'}</Text>
              </Text>
              {(lead.priceFrom || lead.priceTo) && (
                <Text style={[styles.detailSectionRow, { color: colors.primary, fontWeight: '700' }]}>
                  Budget: {lead.priceFrom ? `₦${lead.priceFrom.toLocaleString()}` : '0'} -{' '}
                  {lead.priceTo ? `₦${lead.priceTo.toLocaleString()}` : 'Any'}
                </Text>
              )}
            </View>

            {/* Stage Changer */}
            <Text style={[styles.detailSectionTitle, { color: colors.text, marginTop: 14, marginBottom: 8 }]}>
              Pipeline Stage
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {MANUAL_LEAD_STATUS_OPTIONS.filter((s) => s.value !== 'all').map((st) => {
                const isCurrent = lead.status === st.value;
                return (
                  <TouchableOpacity
                    key={st.value}
                    onPress={() => onUpdateStatus(st.value as ManualLeadItem['status'])}
                    style={[
                      styles.choicePill,
                      isCurrent
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { borderColor: colors.border },
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isCurrent ? '#ffffff' : colors.text }}>
                      {st.shortLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Notes Editor Card */}
            <View
              style={[
                styles.detailSectionCard,
                { backgroundColor: isDark ? '#262626' : '#f8fafc', borderColor: colors.border },
              ]}
            >
              <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Internal Notes</Text>
              <TextInput
                value={notesText}
                onChangeText={setNotesText}
                placeholder="Add follow-up notes, client preferences..."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={4}
                style={[styles.notesInput, { color: colors.text }]}
              />
              <TouchableOpacity
                disabled={isSavingNotes}
                onPress={() => onSaveNotes(notesText)}
                style={[styles.saveNoteBtn, { backgroundColor: colors.primary }]}
              >
                {isSavingNotes ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveNoteBtnText}>Save Notes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLeadName: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
  },
  detailLeadSource: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 8,
  },
  detailSectionRow: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  notesInput: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    lineHeight: 18,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 8,
  },
  saveNoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
});
