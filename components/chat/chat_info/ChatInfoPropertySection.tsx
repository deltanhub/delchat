import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { ChatInfoPropertySectionProps } from './types';

export const ChatInfoPropertySection: React.FC<ChatInfoPropertySectionProps> = ({
  conversation,
  onClose,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!conversation.listing) return null;

  const handleOpenProperty = () => {
    onClose();
    const siteUrl =
      process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
    const propertyUrl = `${siteUrl}/properties/${conversation.listing!.id}`;
    Linking.openURL(propertyUrl).catch(() => {
      Alert.alert(
        conversation.listing!.title,
        `Location: ${conversation.listing!.address || 'Nigeria'}\n\nView details online at:\n${propertyUrl}`
      );
    });
  };

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>
        ASSOCIATED PROPERTY
      </Text>
      <TouchableOpacity
        onPress={handleOpenProperty}
        style={[styles.propertyRow, { borderColor: colors.border }]}
      >
        {conversation.listing.imageUrl ? (
          <Image
            source={{ uri: conversation.listing.imageUrl }}
            style={styles.propertyThumb}
          />
        ) : (
          <View
            style={[
              styles.propertyThumbPlaceholder,
              { backgroundColor: colors.border },
            ]}
          >
            <Ionicons name="home" size={24} color={colors.placeholder} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.propertyTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {conversation.listing.title}
          </Text>
          <Text
            style={[styles.propertySub, { color: colors.placeholder }]}
          >
            Tap to view listing details
          </Text>
        </View>
        <Ionicons name="open-outline" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};
