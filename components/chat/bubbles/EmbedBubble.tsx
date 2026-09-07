import React from 'react';
import { StyleSheet, View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage, formatMsgTime } from './types';

interface EmbedBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
}

export default function EmbedBubble({ message, isCurrentUser, isStarred = false }: EmbedBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const embedData = message.structuredPayload?.embed || message.structuredPayload || {};
  const embedUrl = embedData.url || message.body;
  const embedTitle = embedData.title || '3D Virtual Tour / Embed';

  return (
    <View style={[styles.rowContainer, isCurrentUser ? styles.justifyRight : styles.justifyLeft]}>
      <View style={[styles.embedCard, { backgroundColor: colors.card, borderColor: isDark ? '#3b2354' : '#e9ddfc' }]}>
        <View style={[styles.embedHeader, { backgroundColor: isDark ? '#220c3a' : '#f5effe', borderBottomColor: isDark ? '#3b2354' : '#e9ddfc' }]}>
          <Ionicons name="cube" size={18} color={isDark ? '#c084fc' : '#7c3aed'} style={{ marginRight: 6 }} />
          <Text style={[styles.embedHeaderTitle, { color: isDark ? '#c084fc' : '#7c3aed' }]}>3D VIRTUAL TOUR</Text>
        </View>
        <View style={styles.embedBody}>
          <Text style={[styles.embedTitle, { color: colors.text }]}>{embedTitle}</Text>
          <Text style={[styles.embedUrlText, { color: colors.placeholder }]} numberOfLines={1}>
            {embedUrl}
          </Text>
          <Pressable
            onPress={() => embedUrl && Linking.openURL(embedUrl).catch(() => null)}
            accessibilityLabel={`Launch 3D Virtual Space: ${embedTitle}`}
            accessibilityRole="button"
            accessibilityHint="Opens interactive 3D virtual tour in browser"
            style={({ pressed }) => [
              styles.embedActionBtn,
              {
                backgroundColor: isDark ? '#7c3aed' : '#6d28d9',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Ionicons name="open-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.embedActionBtnText}>Launch 3D Space</Text>
          </Pressable>
          <View style={styles.timeRow}>
            {isStarred && (
              <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.msgTimeText, { color: colors.placeholder }]}>
              {formatMsgTime(message.sentAt)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  justifyRight: {
    justifyContent: 'flex-end',
  },
  justifyLeft: {
    justifyContent: 'flex-start',
  },
  embedCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  embedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  embedHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Typography.fontFamily,
  },
  embedBody: {
    padding: 16,
    gap: 8,
  },
  embedTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  embedUrlText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  embedActionBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  embedActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  msgTimeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
  },
});
