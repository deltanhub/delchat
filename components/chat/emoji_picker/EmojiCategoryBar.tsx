import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { EMOJI_CATEGORIES } from '../../../constants/emoji-data';
import { styles } from './styles';
import { EmojiCategoryBarProps } from './types';

export const EmojiCategoryBar: React.FC<EmojiCategoryBarProps> = ({
  recentCount,
  activeCategoryId,
  onSelectCategory,
  primaryColor,
  isDark,
  borderColor,
}) => {
  return (
    <View
      style={[
        styles.categoryBar,
        {
          backgroundColor: isDark ? '#1c1c1e' : '#fafbfd',
          borderBottomColor: borderColor,
        },
      ]}
    >
      {recentCount > 0 && (
        <TouchableOpacity
          onPress={() => onSelectCategory('recent')}
          style={[
            styles.categoryTab,
            activeCategoryId === 'recent' && [
              styles.activeTab,
              { backgroundColor: primaryColor },
            ],
          ]}
        >
          <Text style={styles.categoryEmoji}>🕒</Text>
        </TouchableOpacity>
      )}
      {EMOJI_CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onSelectCategory(category.id)}
          style={[
            styles.categoryTab,
            activeCategoryId === category.id && [
              styles.activeTab,
              { backgroundColor: primaryColor },
            ],
          ]}
        >
          <Text style={styles.categoryEmoji}>{category.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
