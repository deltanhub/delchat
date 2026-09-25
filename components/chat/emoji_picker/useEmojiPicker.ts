import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMOJI_CATEGORIES, EmojiItem } from '../../../constants/emoji-data';
import { RECENT_STORAGE_KEY } from './utils';

export function useEmojiPicker(onSelectEmoji: (emoji: string) => void) {
  const [searchText, setSearchText] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('realestate');
  const [recentEmojis, setRecentEmojis] = useState<EmojiItem[]>([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const stored = await AsyncStorage.getItem(RECENT_STORAGE_KEY);
        if (stored) {
          setRecentEmojis(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Failed to load recent emojis', e);
      }
    }
    loadRecent();
  }, []);

  const handleEmojiPress = async (emoji: EmojiItem) => {
    onSelectEmoji(emoji.char);

    const updated = [emoji, ...recentEmojis.filter((r) => r.char !== emoji.char)].slice(0, 16);
    setRecentEmojis(updated);
    try {
      await AsyncStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save recent emoji', e);
    }
  };

  const filteredEmojis = useMemo((): EmojiItem[] => {
    if (!searchText.trim()) {
      if (activeCategoryId === 'recent') {
        return recentEmojis;
      }
      const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId);
      return cat ? cat.emojis : [];
    }

    const query = searchText.toLowerCase().trim();
    const results: EmojiItem[] = [];
    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((emoji) => {
        if (
          emoji.name.toLowerCase().includes(query) ||
          emoji.tags.some((t) => t.toLowerCase().includes(query))
        ) {
          if (!results.some((r) => r.char === emoji.char)) {
            results.push(emoji);
          }
        }
      });
    });
    return results;
  }, [searchText, activeCategoryId, recentEmojis]);

  return {
    searchText,
    setSearchText,
    activeCategoryId,
    setActiveCategoryId,
    recentEmojis,
    handleEmojiPress,
    filteredEmojis,
  };
}
