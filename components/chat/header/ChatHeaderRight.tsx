import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { ChatHeaderRightProps } from './types';

export const ChatHeaderRight: React.FC<ChatHeaderRightProps> = ({
  canSendMessages,
  isDark,
  onAudioCall,
  onVideoCall,
  onOpenMenu,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const headerIconColor = isDark ? '#ffffff' : colors.primary;

  return (
    <View style={styles.rightSection}>
      <ScalePressable
        onPress={onAudioCall}
        disabled={!canSendMessages}
        style={[styles.iconButton, !canSendMessages && styles.disabledBtn]}
        accessibilityRole="button"
        accessibilityLabel="Voice Call"
      >
        <Ionicons name="call-outline" size={22} color={headerIconColor} />
      </ScalePressable>

      <ScalePressable
        onPress={onVideoCall}
        disabled={!canSendMessages}
        style={[styles.iconButton, !canSendMessages && styles.disabledBtn]}
        accessibilityRole="button"
        accessibilityLabel="Video Call"
      >
        <Ionicons name="videocam-outline" size={22} color={headerIconColor} />
      </ScalePressable>

      <ScalePressable
        onPress={onOpenMenu}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="More Options"
      >
        <Ionicons name="ellipsis-vertical" size={22} color={headerIconColor} />
      </ScalePressable>
    </View>
  );
};
