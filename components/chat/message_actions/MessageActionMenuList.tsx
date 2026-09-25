import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { MessageActionMenuListProps } from './types';

export const MessageActionMenuList: React.FC<MessageActionMenuListProps> = ({
  message,
  isCurrentUser,
  isStarred,
  isDark,
  onReply,
  onCopy,
  onForward,
  onStarToggle,
  onAskAI,
  onInfo,
  onDelete,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.actionMenuCard,
        {
          backgroundColor: isDark ? '#1f1f23' : '#ffffff',
          borderColor: isDark ? '#333338' : '#e2e8f0',
          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      {/* Reply */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReply}
        style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
        accessibilityRole="button"
        accessibilityLabel="Reply"
      >
        <Text style={[styles.menuItemLabel, { color: colors.text }]}>Reply</Text>
        <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Copy Text */}
      {message.body ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCopy}
          style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
          accessibilityRole="button"
          accessibilityLabel="Copy Text"
        >
          <Text style={[styles.menuItemLabel, { color: colors.text }]}>Copy Text</Text>
          <Ionicons name="copy-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      ) : null}

      {/* Forward / Share */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onForward}
        style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
        accessibilityRole="button"
        accessibilityLabel="Forward"
      >
        <Text style={[styles.menuItemLabel, { color: colors.text }]}>Forward</Text>
        <Ionicons name="arrow-redo-outline" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Star / Save */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onStarToggle}
        style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
        accessibilityRole="button"
        accessibilityLabel={isStarred ? 'Unstar message' : 'Star message'}
      >
        <Text style={[styles.menuItemLabel, { color: isStarred ? '#f59e0b' : colors.text }]}>
          {isStarred ? 'Unstar message' : 'Star message'}
        </Text>
        <Ionicons
          name={isStarred ? 'star' : 'star-outline'}
          size={20}
          color={isStarred ? '#f59e0b' : colors.text}
        />
      </TouchableOpacity>

      {/* Ask Deltan AI */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onAskAI}
        style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
        accessibilityRole="button"
        accessibilityLabel="Ask Deltan AI"
      >
        <Text style={[styles.menuItemLabel, { color: isDark ? '#f472b6' : colors.primary }]}>
          Ask Deltan AI
        </Text>
        <Ionicons name="sparkles" size={19} color={isDark ? '#f472b6' : colors.primary} />
      </TouchableOpacity>

      {/* Message Info */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onInfo}
        style={[styles.menuItemRow, { borderBottomColor: isDark ? '#2c2c30' : '#f1f5f9' }]}
        accessibilityRole="button"
        accessibilityLabel="Message Info"
      >
        <Text style={[styles.menuItemLabel, { color: colors.text }]}>Message Info</Text>
        <Ionicons name="information-circle-outline" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Delete (if sender or admin) */}
      {isCurrentUser && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDelete}
          style={[styles.menuItemRow, { borderBottomWidth: 0 }]}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <Text style={[styles.menuItemLabel, { color: '#ef4444' }]}>Delete</Text>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  );
};
