import React from 'react';
import { View, Text } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { AskAIContextCardProps } from './types';

export const AskAIContextCard: React.FC<AskAIContextCardProps> = ({
  messageBody,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.contextBox,
        {
          backgroundColor: isDark ? '#1f1f23' : '#f8fafc',
          borderColor: isDark ? '#2e2e33' : '#e2e8f0',
        },
      ]}
    >
      <Text
        style={[
          styles.contextLabel,
          { color: isDark ? '#f4a5b8' : colors.primary },
        ]}
      >
        Referenced Message:
      </Text>
      <Text
        style={[styles.contextText, { color: colors.text }]}
        numberOfLines={3}
      >
        "{messageBody || 'Attachment / Form'}"
      </Text>
    </View>
  );
};
