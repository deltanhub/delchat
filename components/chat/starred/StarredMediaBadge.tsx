import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarredMessageItem } from './types';

interface StarredMediaBadgeProps {
  item: StarredMessageItem;
  isDark: boolean;
  colors: any;
}

export default function StarredMediaBadge({ item, isDark, colors }: StarredMediaBadgeProps) {
  if (item.messageKind === 'listing_card') {
    return (
      <View style={[styles.badge, { backgroundColor: isDark ? '#27272a' : '#f4e7eb' }]}>
        <Ionicons name="home" size={15} color={colors.primary} />
        <Text style={[styles.text, { color: colors.primary }]} numberOfLines={1}>Property Listing Card</Text>
      </View>
    );
  }

  if (item.messageKind === 'voice_note') {
    return (
      <View style={[styles.badge, { backgroundColor: isDark ? '#27272a' : '#f0fdf4' }]}>
        <Ionicons name="mic" size={15} color="#16a34a" />
        <Text style={[styles.text, { color: '#16a34a' }]} numberOfLines={1}>Voice Recording</Text>
      </View>
    );
  }

  if (item.messageKind === 'inquiry_form' || item.messageKind === 'inquiry_response') {
    return (
      <View style={[styles.badge, { backgroundColor: isDark ? '#27272a' : '#eff6ff' }]}>
        <Ionicons name="document-text" size={15} color="#2563eb" />
        <Text style={[styles.text, { color: '#2563eb' }]} numberOfLines={1}>Inquiry Questionnaire</Text>
      </View>
    );
  }

  if (item.attachments && item.attachments.length > 0) {
    const att = item.attachments[0];
    const iconName = att.kind === 'video' ? 'videocam' : att.kind === 'audio' ? 'musical-notes' : 'document-attach';
    return (
      <View style={[styles.badge, { backgroundColor: isDark ? '#27272a' : '#f4f4f5' }]}>
        <Ionicons name={iconName} size={15} color={colors.placeholder} />
        <Text style={[styles.text, { color: colors.placeholder }]} numberOfLines={1}>
          {att.originalName || att.name || 'Attachment file'}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
