import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';
import { ComposeSelectedChipsProps } from './types';

export default function ComposeSelectedChips({
  selectedContacts,
  onRemoveContact,
  colors,
}: ComposeSelectedChipsProps) {
  if (selectedContacts.length === 0) return null;

  return (
    <View style={[styles.selectedContainer, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedScroll}>
        {selectedContacts.map((contact) => (
          <View key={contact.userId} style={styles.selectedBadge}>
            <View style={styles.badgeAvatarWrapper}>
              {contact.avatarUrl ? (
                <Image source={{ uri: contact.avatarUrl }} style={styles.selectedAvatar} />
              ) : (
                <View style={[styles.selectedAvatarPlaceholder, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={styles.selectedLetter}>
                    {contact.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <ScalePressable
                onPress={() => onRemoveContact(contact)}
                style={[styles.removeBadgeButton, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${contact.fullName}`}
              >
                <Ionicons name="close" size={10} color="#ffffff" />
              </ScalePressable>
            </View>
            <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={1}>
              {contact.fullName.split(' ')[0]}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  selectedScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  selectedBadge: {
    alignItems: 'center',
    width: 60,
  },
  badgeAvatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  selectedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  selectedAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLetter: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  removeBadgeButton: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  selectedName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
});
