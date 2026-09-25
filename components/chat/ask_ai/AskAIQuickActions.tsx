import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { AskAIQuickActionsProps } from './types';

export const AskAIQuickActions: React.FC<AskAIQuickActionsProps> = ({
  actions,
  isDark,
  onSelectAction,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.placeholder }]}>
        Quick Actions
      </Text>
      <View style={styles.chipsRow}>
        {actions.map((action) => (
          <ScalePressable
            key={action.id}
            onPress={() => onSelectAction(action.prompt)}
            style={[
              styles.chip,
              {
                backgroundColor: isDark ? '#27272a' : '#f4e7eb',
                borderColor: isDark ? '#3f3f46' : 'rgba(74, 15, 31, 0.15)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.title}
          >
            <Ionicons
              name={action.icon}
              size={14}
              color={isDark ? '#f4a5b8' : colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.chipText,
                { color: isDark ? '#f4a5b8' : colors.primary },
              ]}
            >
              {action.title}
            </Text>
          </ScalePressable>
        ))}
      </View>
    </View>
  );
};
