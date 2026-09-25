import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextReactionPopoverProps } from './types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function TextReactionPopover({
  isCurrentUser,
  colors,
  isDark,
  onSelectEmoji,
  onOpenFullPicker,
}: TextReactionPopoverProps) {
  return (
    <View
      style={[
        styles.popoverContainer,
        isCurrentUser ? styles.popoverRight : styles.popoverLeft,
        { backgroundColor: colors.card, borderColor: colors.border },
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
        onPress={onOpenFullPicker}
        accessibilityLabel="Open all reaction emojis"
        accessibilityRole="button"
        accessibilityHint="Opens full emoji picker sheet"
        style={[
          styles.popoverEmojiBtn,
          styles.popoverPlusBtn,
          { backgroundColor: isDark ? '#2c2c2e' : '#f0f4f8' },
        ]}
      >
        <Ionicons name="add" size={16} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  popoverContainer: {
    position: 'absolute',
    top: -46,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  popoverRight: {
    right: 12,
  },
  popoverLeft: {
    left: 12,
  },
  popoverEmojiBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  popoverPlusBtn: {
    marginLeft: 2,
  },
  popoverEmoji: {
    fontSize: 20,
  },
});

export default TextReactionPopover;
