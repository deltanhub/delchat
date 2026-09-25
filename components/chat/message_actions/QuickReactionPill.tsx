import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import type { QuickReactionPillProps } from './types';

export const QuickReactionPill: React.FC<QuickReactionPillProps> = ({
  emojis,
  isCurrentUser,
  isDark,
  onSelectEmoji,
}) => {
  return (
    <View
      style={[
        styles.reactionPill,
        {
          backgroundColor: isDark ? '#1f1f23' : '#ffffff',
          borderColor: isDark ? '#333338' : '#e2e8f0',
          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      {emojis.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          activeOpacity={0.7}
          onPress={() => onSelectEmoji(emoji)}
          style={styles.emojiBtn}
          accessibilityRole="button"
          accessibilityLabel={`React with ${emoji}`}
        >
          <Text style={styles.emojiChar}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
