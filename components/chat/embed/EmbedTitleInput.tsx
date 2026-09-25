import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { EmbedTitleInputProps } from './types';

export const EmbedTitleInput: React.FC<EmbedTitleInputProps> = ({
  title,
  setTitle,
  textColor,
  placeholderColor,
  isDark,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: placeholderColor }]}>DISPLAY TITLE (OPTIONAL)</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? '#24242a' : '#f3f4f6',
            borderColor: isDark ? '#33333b' : '#e5e7eb',
          },
        ]}
      >
        <Ionicons name="document-text-outline" size={18} color={placeholderColor} style={{ marginRight: 8 }} />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Master Bedroom 3D Virtual Showcase"
          placeholderTextColor={placeholderColor}
          style={[styles.textInput, { color: textColor }]}
        />
      </View>
    </View>
  );
};
