import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { MediaViewerBottomBarProps } from './types';

export const MediaViewerBottomBar: React.FC<MediaViewerBottomBarProps> = ({
  onOpenExternal,
  bottomInset,
}) => {
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomInset, 16) }]}>
      <TouchableOpacity
        onPress={onOpenExternal}
        style={styles.externalButton}
      >
        <Ionicons name="download-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.externalButtonText}>View Full Original File</Text>
      </TouchableOpacity>
    </View>
  );
};
