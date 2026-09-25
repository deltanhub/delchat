import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { getCountryCodeFromFlag } from '../../EmojiPicker';
import { TextReactionPillRowProps } from './types';

export function TextReactionPillRow({
  reactions,
  isCurrentUser,
  borderColor,
  cardColor,
}: TextReactionPillRowProps) {
  if (!reactions || Object.keys(reactions).length === 0) return null;

  return (
    <View
      style={[
        styles.reactionsRow,
        isCurrentUser ? styles.reactionsRight : styles.reactionsLeft,
        { borderColor, backgroundColor: cardColor },
      ]}
    >
      {Object.keys(reactions).map((emoji) => {
        const flagCode = getCountryCodeFromFlag(emoji);
        if (flagCode) {
          return (
            <Image
              key={emoji}
              source={{ uri: `https://flagcdn.com/w40/${flagCode}.png` }}
              style={styles.flagImage}
            />
          );
        }
        return (
          <Text key={emoji} style={styles.reactionEmoji}>
            {emoji}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  reactionsRow: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    elevation: 2,
  },
  reactionsRight: {
    right: 8,
  },
  reactionsLeft: {
    left: 8,
  },
  flagImage: {
    width: 14,
    height: 10,
    borderRadius: 1,
    marginHorizontal: 1,
    alignSelf: 'center',
  },
  reactionEmoji: {
    fontSize: 11,
  },
});

export default TextReactionPillRow;
