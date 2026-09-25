import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';
import { STATUS_PIPELINE } from './pipeline';

export interface QuickStatusModalProps {
  visible: boolean;
  currentStatus?: string;
  colors: any;
  isDark: boolean;
  onClose: () => void;
  onSelectStatus: (status: string) => void;
}

export function QuickStatusModal({
  visible,
  currentStatus,
  colors,
  isDark,
  onClose,
  onSelectStatus,
}: QuickStatusModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.leadModalBackdrop} onPress={onClose}>
        <View style={[styles.leadStatusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.leadModalTitle, { color: colors.text }]}>Update Pipeline Stage</Text>
          <Text style={[styles.leadModalSubtitle, { color: colors.placeholder }]}>
            Select the current sales progress stage for this inquiry
          </Text>

          {STATUS_PIPELINE.map((st) => {
            const isCurrent =
              currentStatus === st.value ||
              (st.value === 'closed_won' && currentStatus === 'closed') ||
              (st.value === 'closed_lost' && currentStatus === 'lost');
            return (
              <TouchableOpacity
                key={st.value}
                onPress={() => {
                  onSelectStatus(st.value);
                  onClose();
                }}
                style={[
                  styles.leadStatusOption,
                  isCurrent && { backgroundColor: isDark ? '#262626' : '#f1f5f9' },
                ]}
              >
                <View
                  style={[
                    styles.leadStripStatusDot,
                    {
                      backgroundColor: st.color,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.leadStatusOptionText,
                    { color: colors.text, fontWeight: isCurrent ? '700' : '500' },
                  ]}
                >
                  {st.label}
                </Text>
                {isCurrent && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  leadModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  leadStatusCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  leadModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  leadModalSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    fontFamily: Typography.fontFamily,
  },
  leadStatusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 3,
  },
  leadStripStatusDot: {
    marginRight: 6,
  },
  leadStatusOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    marginLeft: 8,
  },
});

export default QuickStatusModal;
