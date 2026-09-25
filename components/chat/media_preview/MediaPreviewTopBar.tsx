import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { MediaPreviewTopBarProps } from './types';

export const MediaPreviewTopBar: React.FC<MediaPreviewTopBarProps> = ({
  topInset,
  totalAssets,
  selectedIndex,
  onCancel,
  onRemoveCurrent,
}) => {
  return (
    <View style={[styles.topBar, { paddingTop: Math.max(topInset, 16) }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onCancel();
        }}
        style={styles.topBarBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={26} color="#ffffff" />
      </TouchableOpacity>

      <View style={styles.topCenterTitle}>
        {totalAssets > 1 && (
          <Text style={styles.counterText}>
            {selectedIndex + 1} of {totalAssets}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onRemoveCurrent}
        style={styles.topBarBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="trash-outline" size={22} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};
