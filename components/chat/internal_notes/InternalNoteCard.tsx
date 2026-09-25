import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { InternalNoteCardProps } from './types';

export const InternalNoteCard: React.FC<InternalNoteCardProps> = ({
  item,
  isDark,
  formatDate,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.noteCard,
        {
          backgroundColor: isDark ? '#1c1917' : '#fffbeb',
          borderColor: isDark ? '#442807' : '#fef08a',
        },
      ]}
    >
      <View style={styles.noteTopRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="shield-checkmark" size={14} color="#f59e0b" />
          <Text style={[styles.authorName, { color: isDark ? '#fef3c7' : '#78350f' }]}>
            {item.authorName}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.placeholder }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.noteBody, { color: isDark ? '#f5f5f4' : '#1c1917' }]}>
        {item.body}
      </Text>
    </View>
  );
};
