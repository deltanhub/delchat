import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../constants/Typography';
import { styles } from './styles';
import { EmbedUrlInputProps } from './types';

export const EmbedUrlInput: React.FC<EmbedUrlInputProps> = ({
  url,
  setUrl,
  error,
  setError,
  onPaste,
  textColor,
  placeholderColor,
  primaryColor,
  isDark,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: placeholderColor }]}>EMBED URL (REQUIRED)</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? '#24242a' : '#f3f4f6',
            borderColor: error ? '#ef4444' : isDark ? '#33333b' : '#e5e7eb',
          },
        ]}
      >
        <Ionicons name="link-outline" size={18} color={placeholderColor} style={{ marginRight: 8 }} />
        <TextInput
          value={url}
          onChangeText={(t) => {
            setUrl(t);
            setError(null);
          }}
          placeholder="https://my.matterport.com/show/?m=..."
          placeholderTextColor={placeholderColor}
          style={[styles.textInput, { color: textColor }]}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity onPress={onPaste} style={styles.pasteBtn}>
          <Text style={[styles.pasteBtnText, { color: primaryColor }]}>Paste</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 5 }}>
        <Ionicons name="shield-checkmark" size={13} color={primaryColor} />
        <Text style={{ fontSize: 11, color: placeholderColor, fontFamily: Typography.fontFamily }}>
          Verified 3D providers: Matterport, Kuula, YouTube, Vimeo, DeltanHub
        </Text>
      </View>
    </View>
  );
};
