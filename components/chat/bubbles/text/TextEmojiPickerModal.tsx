import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmojiPicker from '../../EmojiPicker';
import { Typography } from '../../../../constants/Typography';
import { TextEmojiPickerModalProps } from './types';

export function TextEmojiPickerModal({
  visible,
  colors,
  onClose,
  onSelectEmoji,
}: TextEmojiPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>React with Emoji</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} accessibilityLabel="Close emoji picker" accessibilityRole="button">
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <EmojiPicker
            onSelectEmoji={onSelectEmoji}
            onClose={onClose}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  modalCloseBtn: {
    padding: 4,
  },
});

export default TextEmojiPickerModal;
