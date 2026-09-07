import React from 'react';
import { StyleSheet, View, Text, Image, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { ChatMessage, formatMsgTime } from './types';

interface BroadcastBubbleProps {
  message: ChatMessage;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
}

export default function BroadcastBubble({ message, onPressMedia }: BroadcastBubbleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const payload = message.structuredPayload || {};
  const title = payload.title || 'Official Announcement';
  const body = payload.body || message.body;
  const media = (payload.media || []) as Array<{ kind: 'image' | 'video' | 'tour'; url: string; title?: string }>;
  const ctaLabel = payload.cta_label;
  const ctaUrl = payload.cta_url;

  return (
    <View style={[styles.rowContainer, styles.justifyLeft, { marginVertical: 8 }]}>
      <View style={{ width: '92%', maxWidth: 420 }}>
        {/* Header Tag */}
        <View style={styles.headerTagRow}>
          <Text style={styles.brandTitle}>
            DELTANHUB
          </Text>
          <View style={styles.verifiedCheck}>
            <Ionicons name="checkmark" size={9} color="#ffffff" />
          </View>
          <View style={styles.announcementBadge}>
            <Text style={styles.announcementBadgeText}>
              OFFICIAL ANNOUNCEMENT
            </Text>
          </View>
        </View>

        {/* Card Container */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? '#3a1a24' : '#eedde2',
            },
          ]}
        >
          {/* Images / Flyers */}
          {media.filter((m) => m.kind === 'image').map((img, idx) => (
            <Pressable
              key={idx}
              onPress={() => onPressMedia?.(img.url, 'image', img.title || title)}
              style={styles.imageContainer}
            >
              <Image source={{ uri: img.url }} style={styles.bannerImage} resizeMode="cover" />
            </Pressable>
          ))}

          {/* Video preview / launcher */}
          {media.filter((m) => m.kind === 'video').map((vid, idx) => (
            <Pressable
              key={idx}
              onPress={() => Linking.openURL(vid.url)}
              style={styles.videoContainer}
            >
              <View style={styles.playButton}>
                <Ionicons name="play" size={22} color="#ffffff" style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.videoPromptText}>
                Watch Promotional Video ↗
              </Text>
            </Pressable>
          ))}

          {/* 3D Tour launcher */}
          {media.filter((m) => m.kind === 'tour').map((tour, idx) => (
            <Pressable
              key={idx}
              onPress={() => Linking.openURL(tour.url)}
              style={[
                styles.tourContainer,
                {
                  backgroundColor: isDark ? '#201015' : '#fcf5f7',
                  borderBottomColor: isDark ? '#3a1a24' : '#f0e0e5',
                },
              ]}
            >
              <Ionicons name="cube" size={20} color="#5C1324" />
              <View style={{ flex: 1 }}>
                <Text style={styles.tourTitle}>
                  Interactive 3D Virtual Tour
                </Text>
                <Text style={[styles.tourSubtitle, { color: colors.placeholder }]}>
                  Tap to open immersive tour ↗
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#5C1324" />
            </Pressable>
          ))}

          {/* Content Body */}
          <View style={styles.contentBody}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.contentText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              {body}
            </Text>

            {/* Call To Action Button */}
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
                <Text style={styles.ctaButtonText}>
                  {ctaLabel}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#ffffff" />
              </Pressable>
            )}

            {/* Footer info */}
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

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  justifyLeft: {
    justifyContent: 'flex-start',
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5C1324',
    letterSpacing: 0.8,
  },
  verifiedCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#5C1324',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementBadge: {
    backgroundColor: '#faecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  announcementBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#5C1324',
  },
  cardContainer: {
    borderRadius: 20,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#5C1324',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5eff1',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#101828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5C1324',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPromptText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  tourContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
  },
  tourTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C1324',
  },
  tourSubtitle: {
    fontSize: 10,
  },
  contentBody: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  contentText: {
    fontSize: 13,
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#5C1324',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
