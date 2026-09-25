import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { EmbedHeaderProps } from './types';

export const EmbedHeader: React.FC<EmbedHeaderProps> = ({
  onClose,
  textColor,
  placeholderColor,
}) => {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: textColor }]}>3D Tour & Video Embed</Text>
        <Text style={[styles.subtitle, { color: placeholderColor }]}>
          Share a Matterport 3D showcase, virtual walkthrough, or YouTube tour
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={20} color={textColor} />
      </TouchableOpacity>
    </View>
  );
};
