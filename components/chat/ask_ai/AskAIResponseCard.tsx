import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { AskAIResponseCardProps } from './types';

export const AskAIResponseCard: React.FC<AskAIResponseCardProps> = ({
  response,
  isDark,
  onInsert,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.responseCard,
        {
          backgroundColor: isDark ? '#1a1016' : '#fff5f7',
          borderColor: isDark ? '#4a1525' : '#f7c5d2',
        },
      ]}
    >
      <View style={styles.responseHeaderRow}>
        <Ionicons
          name="sparkles"
          size={14}
          color={isDark ? '#f4a5b8' : colors.primary}
        />
        <Text
          style={[
            styles.responseHeaderTitle,
            { color: isDark ? '#f4a5b8' : colors.primary },
          ]}
        >
          Suggested Answer
        </Text>
      </View>
      <Text style={[styles.responseText, { color: colors.text }]}>
        {response}
      </Text>
      <ScalePressable
        onPress={onInsert}
        style={[styles.insertBtn, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Insert into Message"
      >
        <Ionicons
          name="chatbubble-outline"
          size={16}
          color="#ffffff"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.insertBtnText}>Insert into Message</Text>
      </ScalePressable>
    </View>
  );
};
