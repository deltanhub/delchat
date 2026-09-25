import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { InternalNotesHeaderProps } from './types';

export const InternalNotesHeader: React.FC<InternalNotesHeaderProps> = ({
  title,
  isDark,
  onClose,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <>
      <View style={styles.dragHandle} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.badgeIcon, { backgroundColor: isDark ? '#382006' : '#fef3c7' }]}>
            <Ionicons name="lock-closed" size={18} color="#f59e0b" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.subTitle, { color: '#f59e0b' }]}>STAFF ONLY</Text>
              <View style={styles.privatePill}>
                <Text style={styles.privatePillText}>Invisible to Client</Text>
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: isDark ? '#262626' : '#f3f4f6' }]}
          accessibilityRole="button"
          accessibilityLabel="Close internal notes"
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </>
  );
};
