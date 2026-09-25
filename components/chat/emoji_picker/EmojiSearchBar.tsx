import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { EmojiSearchBarProps } from './types';

export const EmojiSearchBar: React.FC<EmojiSearchBarProps> = ({
  searchText,
  onChangeSearchText,
  onClearSearch,
  onClose,
  placeholderColor,
  textColor,
  primaryColor,
  isDark,
}) => {
  return (
    <View style={styles.searchRow}>
      <View
        style={[
          styles.searchBar,
          { backgroundColor: isDark ? '#2c2c2e' : '#f0f4f8' },
        ]}
      >
        <Ionicons name="search" size={16} color={placeholderColor} style={styles.searchIcon} />
        <TextInput
          placeholder="Search emoji..."
          placeholderTextColor={placeholderColor}
          value={searchText}
          onChangeText={onChangeSearchText}
          style={[styles.searchInput, { color: textColor }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText !== '' && (
          <TouchableOpacity onPress={onClearSearch}>
            <Ionicons name="close-circle" size={16} color={placeholderColor} style={{ marginRight: 6 }} />
          </TouchableOpacity>
        )}
      </View>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text
            style={{
              color: isDark ? '#ffffff' : primaryColor,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            Done
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
