import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface PropertyCatalogHeaderProps {
  isDark: boolean;
  colors: { text: string; placeholder: string };
  onClose: () => void;
}

export function PropertyCatalogHeader({ isDark, colors, onClose }: PropertyCatalogHeaderProps) {
  return (
    <>
      <View style={[styles.dragHandle, { backgroundColor: isDark ? '#383848' : '#cbd5e1' }]} />
      <View style={[styles.header, { borderBottomColor: isDark ? '#262626' : '#e5e7eb' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Property Catalog</Text>
          <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
            Share a verified listing directly into this conversation
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </>
  );
}
