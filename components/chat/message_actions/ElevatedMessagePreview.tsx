import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { ElevatedMessagePreviewProps } from './types';

export const ElevatedMessagePreview: React.FC<ElevatedMessagePreviewProps> = ({
  message,
  isCurrentUser,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.messagePreviewBubble,
        {
          backgroundColor: isCurrentUser
            ? colors.primary
            : isDark
            ? '#232326'
            : '#ffffff',
          borderColor: isCurrentUser ? 'rgba(255,255,255,0.1)' : colors.border,
          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      {!isCurrentUser && (
        <Text
          style={[
            styles.previewAuthorName,
            { color: isDark ? '#ffffff' : colors.primary },
          ]}
        >
          {message.authorName}
        </Text>
      )}

      {message.body ? (
        <Text
          style={[
            styles.previewBodyText,
            { color: isCurrentUser ? '#ffffff' : colors.text },
          ]}
          numberOfLines={6}
        >
          {message.body}
        </Text>
      ) : null}

      {message.attachments && message.attachments.length > 0 && (
        <View style={styles.attachmentBadge}>
          <Ionicons
            name={
              message.attachments[0].kind === 'document'
                ? 'document-text'
                : 'image'
            }
            size={14}
            color={isCurrentUser ? '#ffffff' : colors.placeholder}
          />
          <Text
            style={[
              styles.attachmentBadgeText,
              {
                color: isCurrentUser
                  ? 'rgba(255,255,255,0.85)'
                  : colors.placeholder,
              },
            ]}
            numberOfLines={1}
          >
            {message.attachments[0].originalName ||
              `${message.attachments.length} attachment(s)`}
          </Text>
        </View>
      )}

      <Text
        style={[
          styles.previewTimeText,
          {
            color: isCurrentUser
              ? 'rgba(255,255,255,0.7)'
              : colors.placeholder,
          },
        ]}
      >
        {message.sentAt
          ? new Date(message.sentAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </Text>
    </View>
  );
};
