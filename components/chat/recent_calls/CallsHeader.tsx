import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import { callsScreenStyles as styles } from './callsScreenStyles';

interface CallsHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onNewCall: () => void;
  topInset: number;
  isDark: boolean;
  colors: any;
}

export const CallsHeader: React.FC<CallsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNewCall,
  topInset,
  isDark,
  colors,
}) => {
  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: topInset + (Platform.OS === 'ios' ? 8 : 12),
          backgroundColor: isDark ? '#121212' : '#ffffff',
          borderBottomColor: isDark ? '#262626' : colors.border,
        },
      ]}
    >
      <View style={styles.headerTopRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calls</Text>
        <ScalePressable
          onPress={onNewCall}
          accessibilityLabel="Start a new call"
          accessibilityRole="button"
          accessibilityHint="Navigates to contact picker to initiate a call"
          style={[
            styles.headerActionBtn,
            { backgroundColor: isDark ? '#262626' : colors.primarySoft },
          ]}
        >
          <Ionicons name="call" size={18} color={isDark ? '#ffffff' : colors.primary} />
        </ScalePressable>
      </View>

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? '#1a1a1a' : '#f0f4f8',
            borderColor: isDark ? '#333333' : 'transparent',
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={isDark ? 'rgba(255,255,255,0.45)' : colors.placeholder}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search calls by name or phone..."
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.45)' : colors.placeholder}
          value={searchQuery}
          onChangeText={onSearchChange}
          style={[styles.searchInput, { color: colors.text }]}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
