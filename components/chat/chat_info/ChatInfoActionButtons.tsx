import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { ChatInfoActionButtonsProps } from './types';

export const ChatInfoActionButtons: React.FC<ChatInfoActionButtonsProps> = ({
  conversation,
  isDark,
  onClose,
  onAddAsLead,
  onToggleArchive,
  onViewStarred,
  onReportAgent,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={{ gap: 10, marginTop: 4 }}>
      {onViewStarred && (
        <TouchableOpacity
          onPress={() => {
            onClose();
            onViewStarred();
          }}
          style={[
            styles.actionBtn,
            {
              backgroundColor: isDark ? '#261c0d' : '#fefce8',
              borderColor: '#f59e0b',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="View Starred Messages"
        >
          <Ionicons
            name="star-outline"
            size={20}
            color="#f59e0b"
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.actionBtnText,
              { color: isDark ? '#fbbf24' : '#b45309' },
            ]}
          >
            Starred Messages
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => {
          onClose();
          onAddAsLead();
        }}
        style={[
          styles.actionBtn,
          {
            backgroundColor: isDark ? '#262626' : '#fdf3f5',
            borderColor: colors.primary,
          },
        ]}
      >
        <Ionicons
          name="person-add-outline"
          size={20}
          color={colors.primary}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.actionBtnText, { color: colors.primary }]}>
          Add as CRM Lead
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          onClose();
          onToggleArchive();
        }}
        style={[
          styles.actionBtn,
          {
            backgroundColor: isDark ? '#1c1c1e' : '#f3f4f6',
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="archive-outline"
          size={20}
          color={colors.text}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.actionBtnText, { color: colors.text }]}>
          {conversation.isArchived
            ? 'Unarchive Conversation'
            : 'Archive Conversation'}
        </Text>
      </TouchableOpacity>

      {onReportAgent && (
        <TouchableOpacity
          onPress={() => {
            onClose();
            onReportAgent();
          }}
          style={[
            styles.actionBtn,
            {
              backgroundColor: isDark ? '#261219' : '#fff5f5',
              borderColor: isDark ? '#3d1624' : '#fecaca',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Report Agent to Management"
        >
          <Ionicons
            name="flag-outline"
            size={20}
            color="#ef4444"
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>
            Report Agent to Management
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
