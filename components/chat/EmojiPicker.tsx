import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useColorScheme } from '../useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { EMOJI_CATEGORIES, EmojiItem, EmojiCategory } from '../../constants/emoji-data';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

const RECENT_STORAGE_KEY = 'deltanhub_recent_emojis';
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 8;
const EMOJI_SIZE = (width - 32) / COLUMN_COUNT;

export const getCountryCodeFromFlag = (flagEmoji: string): string | null => {
  if (!flagEmoji) return null;
  const codePoints = [...flagEmoji].map((c) => c.codePointAt(0) || 0);
  if (codePoints.length >= 2 && codePoints.every(cp => cp >= 127462 && cp <= 127487)) {
    return codePoints.map(cp => String.fromCharCode(cp - 127462 + 65)).join('').toLowerCase();
  }
  return null;
};

export default function EmojiPicker({ onSelectEmoji, onClose }: EmojiPickerProps) {
  const systemScheme = useColorScheme();
  const colors = Colors[systemScheme];

  const [searchText, setSearchText] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('realestate');
  const [recentEmojis, setRecentEmojis] = useState<EmojiItem[]>([]);

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

  // Load recently used emojis
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

    // Save to recently used list
    const updated = [emoji, ...recentEmojis.filter((r) => r.char !== emoji.char)].slice(0, 16);
    setRecentEmojis(updated);
    try {
      await AsyncStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save recent emoji', e);
    }
  };

  // Filter emojis based on search query
  const getFilteredEmojis = (): EmojiItem[] => {
    if (!searchText.trim()) {
      if (activeCategoryId === 'recent') {
        return recentEmojis;
      }
      const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId);
      return cat ? cat.emojis : [];
    }

    const query = searchText.toLowerCase().trim();
    let results: EmojiItem[] = [];
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
  };

  const visibleEmojis = getFilteredEmojis();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Category Icons Selector Bar */}
      {!searchText && (
        <View style={[styles.categoryBar, { backgroundColor: systemScheme === 'dark' ? '#1c1c1e' : '#fafbfd', borderBottomColor: colors.border }]}>
          {recentEmojis.length > 0 && (
            <TouchableOpacity
              onPress={() => setActiveCategoryId('recent')}
              style={[
                styles.categoryTab,
                activeCategoryId === 'recent' && [styles.activeTab, { backgroundColor: colors.primary }]
              ]}
            >
              <Text style={styles.categoryEmoji}>🕒</Text>
            </TouchableOpacity>
          )}
          {EMOJI_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setActiveCategoryId(category.id)}
              style={[
                styles.categoryTab,
                activeCategoryId === category.id && [styles.activeTab, { backgroundColor: colors.primary }]
              ]}
            >
              <Text style={styles.categoryEmoji}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Input bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: systemScheme === 'dark' ? '#2c2c2e' : '#f0f4f8' }]}>
          <Ionicons name="search" size={16} color={colors.placeholder} style={styles.searchIcon} />
          <TextInput
            placeholder="Search emoji..."
            placeholderTextColor={colors.placeholder}
            value={searchText}
            onChangeText={setSearchText}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color={colors.placeholder} style={{ marginRight: 6 }} />
            </TouchableOpacity>
          )}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color: systemScheme === 'dark' ? '#ffffff' : colors.primary, fontWeight: '600', fontSize: 13 }}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grid Emojis Area */}
      <FlatList
        data={visibleEmojis}
        keyExtractor={(item) => item.char}
        numColumns={COLUMN_COUNT}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleEmojiPress(item)}
            style={styles.emojiCell}
          >
            {renderEmojiChar(item.char)}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.placeholder }]}>
              {searchText ? 'No matching emojis' : 'Recently used emojis will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 14 : 4,
  },
  categoryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 44,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  categoryTab: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    transform: [{ scale: 1.1 }],
  },
  categoryEmoji: {
    fontSize: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
  },
  closeBtn: {
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  emojiCell: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 26,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
});
