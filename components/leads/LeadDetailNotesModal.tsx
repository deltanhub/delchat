import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  LeadDetailNotesModalProps,
  styles,
  LeadDetailHeader,
  LeadDetailContactActions,
  LeadDetailPropertyCard,
  LeadDetailStageSelector,
  LeadDetailNotesEditor,
} from './lead_detail';

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
          <LeadDetailHeader onClose={onClose} textColor={colors.text} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.detailLeadName, { color: colors.text }]}>{lead.contactName}</Text>
            <Text style={[styles.detailLeadSource, { color: colors.placeholder }]}>Source: {lead.source}</Text>

            <LeadDetailContactActions
              contactPhone={lead.contactPhone}
              contactEmail={lead.contactEmail}
            />

            <LeadDetailPropertyCard
              propertyType={lead.propertyType}
              propertyStatus={lead.propertyStatus}
              priceFrom={lead.priceFrom}
              priceTo={lead.priceTo}
              textColor={colors.text}
              borderColor={colors.border}
              primaryColor={colors.primary}
              isDark={isDark}
            />

            <LeadDetailStageSelector
              currentStatus={lead.status}
              onUpdateStatus={onUpdateStatus}
              textColor={colors.text}
              borderColor={colors.border}
              primaryColor={colors.primary}
            />

            <LeadDetailNotesEditor
              notesText={notesText}
              onChangeNotesText={setNotesText}
              onSaveNotes={() => onSaveNotes(notesText)}
              isSavingNotes={isSavingNotes}
              textColor={colors.text}
              placeholderColor={colors.placeholder}
              borderColor={colors.border}
              primaryColor={colors.primary}
              isDark={isDark}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
