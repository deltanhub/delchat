import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface ChatLeadsEmptyStateProps {
  textColor: string;
  placeholderColor: string;
}

export function ChatLeadsEmptyState({ textColor, placeholderColor }: ChatLeadsEmptyStateProps) {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="chatbox-ellipses-outline" size={54} color={placeholderColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No Chat Leads Yet</Text>
      <Text style={[styles.emptySubtitle, { color: placeholderColor }]}>
        When you press &quot;Add as lead&quot; inside a conversation thread, leads appear here for immediate follow-up.
      </Text>
    </View>
  );
}
