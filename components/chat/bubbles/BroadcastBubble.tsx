import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { formatMsgTime } from './types';
import {
  BroadcastBubbleProps,
  BroadcastPayload,
  BroadcastHeader,
  BroadcastMediaView,
  styles,
} from './broadcast';

export default function BroadcastBubble({ message, onPressMedia }: BroadcastBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const payload = (message.structuredPayload || {}) as BroadcastPayload;
  const title = payload.title || 'Official Announcement';
  const body = payload.body || message.body;
  const media = payload.media || [];
  const ctaLabel = payload.cta_label;
  const ctaUrl = payload.cta_url;

  return (
    <View style={[styles.rowContainer, styles.justifyLeft, { marginVertical: 8 }]}>
      <View style={{ width: '92%', maxWidth: 420 }}>
        <BroadcastHeader />

        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? '#3a1a24' : '#eedde2',
            },
          ]}
        >
          <BroadcastMediaView
            media={media}
            title={title}
            isDark={isDark}
            placeholderColor={colors.placeholder}
            onPressMedia={onPressMedia}
          />

          <View style={styles.contentBody}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.contentText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              {body}
            </Text>

            {ctaLabel && ctaUrl && (
              <Pressable
                onPress={() => Linking.openURL(ctaUrl)}
                style={({ pressed }) => [
                  styles.ctaButton,
                  {
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Text style={styles.ctaButtonText}>{ctaLabel}</Text>
                <Ionicons name="arrow-forward" size={14} color="#ffffff" />
              </Pressable>
            )}

            <View
              style={[
                styles.footerRow,
                { borderTopColor: isDark ? '#27272a' : '#f3f4f6' },
              ]}
            >
              <Text style={{ fontSize: 10, color: colors.placeholder }}>Broadcast Announcement</Text>
              <Text style={{ fontSize: 10, color: colors.placeholder }}>{formatMsgTime(message.sentAt)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
