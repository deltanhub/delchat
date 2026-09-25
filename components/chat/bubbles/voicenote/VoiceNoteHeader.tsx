import React from 'react';
import { StyleSheet, Text } from 'react-native';

export interface VoiceNoteHeaderProps {
  authorName?: string;
  staffTag?: string | null;
  isCurrentUser: boolean;
  isDark: boolean;
  primaryColor: string;
}

export function VoiceNoteHeader({
  authorName,
  staffTag,
  isCurrentUser,
  isDark,
  primaryColor,
}: VoiceNoteHeaderProps) {
  if (isCurrentUser && !staffTag) return null;

  return (
    <>
      {!isCurrentUser && authorName && (
        <Text style={[styles.authorLabel, { color: isDark ? '#ffffff' : primaryColor }]}>
          {authorName}
        </Text>
      )}
      {staffTag && (
        <Text
          style={[
            styles.staffTagLabel,
            {
              color: isCurrentUser
                ? 'rgba(255, 255, 255, 0.65)'
                : isDark
                ? '#a1a1aa'
                : '#7b6570',
            },
          ]}
        >
          {staffTag}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  authorLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    paddingLeft: 4,
  },
  staffTagLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
});
