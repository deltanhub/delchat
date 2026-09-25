import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmojiPicker from '../../EmojiPicker';
import { VoiceNoteReactionMenuProps } from './types';
import { styles } from './styles';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function VoiceNoteReactionMenu({
  showPopover,
  showFullPicker,
  isCurrentUser,
  isDark,
  cardColor,
  borderColor,
  textColor,
  onSelectEmoji,
  onOpenFullPicker,
  onClosePopover,
  onCloseFullPicker,
}: VoiceNoteReactionMenuProps) {
  return (
    <>
      {/* Reactions Popover Menu (Long-press triggered) */}
      {showPopover && (
        <View
          style={[
            styles.popoverContainer,
            isCurrentUser ? styles.popoverRight : styles.popoverLeft,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onSelectEmoji(emoji)}
              accessibilityLabel={`React with ${emoji}`}
              accessibilityRole="button"
              style={styles.popoverEmojiBtn}
            >
              <Text style={styles.popoverEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => {
              onClosePopover();
              onOpenFullPicker();
            }}
            accessibilityLabel="Open all reaction emojis"
            accessibilityRole="button"
            style={[
              styles.popoverEmojiBtn,
              styles.popoverPlusBtn,
              { backgroundColor: isDark ? '#2c2c2e' : '#f0f4f8' },
            ]}
          >
            <Ionicons name="add" size={16} color={textColor} />
          </TouchableOpacity>
        </View>
      )}

      {/* Full Emoji Picker Modal Sheet */}
      <Modal
        visible={showFullPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={onCloseFullPicker}
      >
        <Pressable style={styles.modalBackdrop} onPress={onCloseFullPicker}>
          <View style={[styles.modalContent, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>React with Emoji</Text>
              <TouchableOpacity onPress={onCloseFullPicker} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                onSelectEmoji(emoji);
                onCloseFullPicker();
              }}
              onClose={onCloseFullPicker}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
