import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { AskAIHeaderProps } from './types';

export const AskAIHeader: React.FC<AskAIHeaderProps> = ({ isDark, onClose }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: isDark ? '#27272a' : colors.border },
      ]}
    >
      <View style={styles.headerTitleRow}>
        <View
          style={[
            styles.sparkleBadge,
            { backgroundColor: isDark ? '#3d1624' : '#fcedf2' },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={isDark ? '#f4a5b8' : colors.primary}
          />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Deltan Intelligence
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
            AI Real Estate Assistant
          </Text>
        </View>
      </View>
      <ScalePressable
        onPress={onClose}
        style={styles.closeBtn}
        accessibilityRole="button"
        accessibilityLabel="Close Deltan Intelligence"
      >
        <Ionicons name="close" size={22} color={colors.placeholder} />
      </ScalePressable>
    </View>
  );
};
