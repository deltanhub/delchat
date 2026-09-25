import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { EmojiItem } from '../../../constants/emoji-data';
import { styles } from './styles';
import { COLUMN_COUNT, getCountryCodeFromFlag } from './utils';
import { EmojiGridProps } from './types';

export const EmojiGrid: React.FC<EmojiGridProps> = ({
  emojis,
  searchText,
  onSelectEmoji,
  placeholderColor,
}) => {
  const renderEmojiChar = (char: string) => {
    const flagCode = getCountryCodeFromFlag(char);
    if (flagCode) {
      return (
        <Image
          source={{ uri: `https://flagcdn.com/w80/${flagCode}.png` }}
          style={{ width: 30, height: 20, borderRadius: 2, alignSelf: 'center' }}
        />
      );
    }
    return <Text style={styles.emojiText}>{char}</Text>;
  };

  return (
    <FlatList
      data={emojis}
      keyExtractor={(item) => item.char}
      numColumns={COLUMN_COUNT}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelectEmoji(item)}
          style={styles.emojiCell}
        >
          {renderEmojiChar(item.char)}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: placeholderColor }]}>
            {searchText ? 'No matching emojis' : 'Recently used emojis will appear here'}
          </Text>
        </View>
      }
    />
  );
};
