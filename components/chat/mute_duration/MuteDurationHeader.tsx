import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { MuteDurationHeaderProps } from './types';

export const MuteDurationHeader: React.FC<MuteDurationHeaderProps> = ({
  textColor,
  primaryColor,
  isDark,
}) => {
  return (
    <>
      <View style={styles.headerRow}>
        <Ionicons
          name="notifications-off"
          size={22}
          color={primaryColor}
          style={styles.headerIcon}
        />
        <Text style={[styles.title, { color: textColor }]}>
          Mute Notifications
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
        Other participants will not see that you muted this chat. You will still be notified if mentioned.
      </Text>
    </>
  );
};
