import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { MediaViewerTopBarProps } from './types';

export const MediaViewerTopBar: React.FC<MediaViewerTopBarProps> = ({
  title,
  onClose,
  onOpenExternal,
  topInset,
}) => {
  return (
    <View style={[styles.topBar, { paddingTop: Math.max(topInset, 16) }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
        style={styles.topBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={26} color="#ffffff" />
      </TouchableOpacity>

      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>

      <TouchableOpacity
        onPress={onOpenExternal}
        style={styles.topBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="open-outline" size={22} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};
