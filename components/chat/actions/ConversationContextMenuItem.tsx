import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';

export interface ConversationContextMenuItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
  isLast?: boolean;
  isDestructive?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export function ConversationContextMenuItem({
  label,
  iconName,
  iconColor = '#8e8e93',
  onPress,
  isLast = false,
  isDestructive = false,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
}: ConversationContextMenuItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={() => {
        Haptics.impactAsync(hapticStyle);
        onPress();
      }}
      style={[styles.menuRow, isLast && styles.lastMenuRow]}
    >
      <Text
        style={[styles.menuRowText, isDestructive && styles.destructiveText]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Ionicons name={iconName} size={19} color={iconColor} />
    </TouchableOpacity>
  );
}

export default ConversationContextMenuItem;
