import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import Colors from '../../constants/Colors';
import {
  EmojiPickerProps,
  styles,
  getCountryCodeFromFlag,
  useEmojiPicker,
  EmojiCategoryBar,
  EmojiSearchBar,
  EmojiGrid,
} from './emoji_picker';

export { getCountryCodeFromFlag };
export type { EmojiPickerProps };

export default function EmojiPicker({ onSelectEmoji, onClose }: EmojiPickerProps) {
  const systemScheme = useColorScheme();
  const colors = Colors[systemScheme];
  const isDark = systemScheme === 'dark';

  const {
    searchText,
    setSearchText,
    activeCategoryId,
    setActiveCategoryId,
    recentEmojis,
    handleEmojiPress,
    filteredEmojis,
  } = useEmojiPicker(onSelectEmoji);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {!searchText && (
        <EmojiCategoryBar
          recentCount={recentEmojis.length}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          primaryColor={colors.primary}
          isDark={isDark}
          borderColor={colors.border}
        />
      )}

      <EmojiSearchBar
        searchText={searchText}
        onChangeSearchText={setSearchText}
        onClearSearch={() => setSearchText('')}
        onClose={onClose}
        placeholderColor={colors.placeholder}
        textColor={colors.text}
        primaryColor={colors.primary}
        isDark={isDark}
      />

      <EmojiGrid
        emojis={filteredEmojis}
        searchText={searchText}
        onSelectEmoji={handleEmojiPress}
        placeholderColor={colors.placeholder}
      />
    </View>
  );
}
