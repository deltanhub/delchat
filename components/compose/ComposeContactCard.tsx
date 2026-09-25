import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';
import { ComposeContactCardProps } from './types';

export default function ComposeContactCard({
  contact,
  mode,
  isSelected,
  colors,
  onPress,
}: ComposeContactCardProps) {
  return (
    <ScalePressable
      onPress={onPress}
      style={[
        styles.contactItem,
        {
          backgroundColor: isSelected ? colors.primarySoft : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={contact.fullName}
    >
      <View style={styles.contactRow}>
        {contact.avatarUrl ? (
          <Image source={{ uri: contact.avatarUrl }} style={styles.contactAvatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarLetter, { color: colors.primary }]}>
              {contact.fullName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.contactDetails}>
          <Text style={[styles.contactName, { color: colors.text }]}>{contact.fullName}</Text>
          <Text style={[styles.contactRole, { color: colors.placeholder }]}>
            {contact.subtitle || contact.mainRole}
          </Text>
        </View>

        {mode === 'group' && (
          <View style={[styles.checkbox, { borderColor: colors.primary }]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={colors.primary} />
            )}
          </View>
        )}
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  contactItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  contactDetails: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  contactRole: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
