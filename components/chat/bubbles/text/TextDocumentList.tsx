import React from 'react';
import { StyleSheet, View, Text, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../../constants/Typography';
import { TextDocumentListProps } from './types';

export function TextDocumentList({
  documents,
  isCurrentUser,
  isDark,
  textColor,
  placeholderColor,
  primaryColor,
}: TextDocumentListProps) {
  if (!documents || documents.length === 0) return null;

  return (
    <View style={styles.docsList}>
      {documents.map((att) => {
        const ext = (att.originalName || '').split('.').pop()?.toUpperCase() || 'DOC';
        const isPdf = ext === 'PDF';
        const isExcel = ['XLS', 'XLSX', 'CSV'].includes(ext);
        const isWord = ['DOC', 'DOCX'].includes(ext);

        const badgeColor = isPdf ? '#ef4444' : isExcel ? '#10b981' : isWord ? '#3b82f6' : '#8b5cf6';
        const badgeBg = isDark ? 'rgba(255,255,255,0.08)' : `${badgeColor}18`;

        const formattedSize = att.sizeBytes
          ? att.sizeBytes > 1024 * 1024
            ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(att.sizeBytes / 1024)} KB`
          : 'Document';

        return (
          <Pressable
            key={att.id}
            onPress={() => {
              if (att.url) {
                Linking.openURL(att.url).catch(() => {
                  Alert.alert('Open File', 'Could not open this file automatically.');
                });
              }
            }}
            accessibilityLabel={`Document: ${att.originalName}, size ${formattedSize}`}
            accessibilityRole="button"
            accessibilityHint="Double tap to open or download document"
            style={[
              styles.docItemCard,
              {
                backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.15)' : isDark ? '#1c1c1e' : '#f8fafc',
                borderColor: isCurrentUser ? 'rgba(255,255,255,0.25)' : isDark ? '#2c2c2e' : '#e2e8f0',
              },
            ]}
          >
            <View style={[styles.docIconBadge, { backgroundColor: badgeBg }]}>
              <Ionicons
                name={isPdf ? 'document-text' : isExcel ? 'grid' : isWord ? 'document' : 'document-attach'}
                size={20}
                color={badgeColor}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.docNameText, { color: isCurrentUser ? '#ffffff' : textColor }]} numberOfLines={1}>
                {att.originalName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={{ backgroundColor: badgeBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: badgeColor }}>{ext}</Text>
                </View>
                <Text style={[styles.docSizeText, { color: isCurrentUser ? 'rgba(255,255,255,0.75)' : placeholderColor }]}>
                  {formattedSize}
                </Text>
              </View>
            </View>
            <View style={[styles.docActionBtn, { backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : isDark ? '#2c2c2e' : '#e2e8f0' }]}>
              <Ionicons name="arrow-down" size={15} color={isCurrentUser ? '#ffffff' : primaryColor} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  docsList: {
    marginBottom: 6,
    gap: 6,
  },
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 260,
  },
  docIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docNameText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  docSizeText: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  docActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

export default TextDocumentList;
