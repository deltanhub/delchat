import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import { ChatConversation } from './ConversationRow';

interface ChatInfoModalProps {
  visible: boolean;
  conversation: ChatConversation | null;
  messagesCount: number;
  onClose: () => void;
  onAddAsLead: () => void;
  onToggleArchive: () => void;
  onViewStarred?: () => void;
}

export const ChatInfoModal: React.FC<ChatInfoModalProps> = ({
  visible,
  conversation,
  messagesCount,
  onClose,
  onAddAsLead,
  onToggleArchive,
  onViewStarred,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  if (!visible || !conversation) return null;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Chat Info</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* User Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.avatarRow}>
                {conversation.partnerAvatarUrl ? (
                  <Image source={{ uri: conversation.partnerAvatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}>
                    <Text style={[styles.avatarInitialsText, { color: isDark ? '#ffffff' : colors.primary }]}>
                      {getInitials(conversation.partnerName)}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.partnerName, { color: colors.text }]}>
                    {conversation.partnerName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={[styles.roleBadge, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                        {conversation.conversationKind === 'listing_human' ? 'Listing Inquiry' : 'Direct Contact'}
                      </Text>
                    </View>
                    {conversation.isArchived && (
                      <View style={[styles.roleBadge, { backgroundColor: '#fef3c7' }]}>
                        <Text style={[styles.roleBadgeText, { color: '#d97706' }]}>Archived</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Associated Property Section */}
            {conversation.listing && (
              <View style={[styles.sectionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>ASSOCIATED PROPERTY</Text>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com';
                    Linking.openURL(`${siteUrl}/property/${conversation.listing!.id}`).catch(() => {
                      router.push(`/property/${conversation.listing!.id}` as Href);
                    });
                  }}
                  style={[styles.propertyRow, { borderColor: colors.border }]}
                >
                  {conversation.listing.imageUrl ? (
                    <Image source={{ uri: conversation.listing.imageUrl }} style={styles.propertyThumb} />
                  ) : (
                    <View style={[styles.propertyThumbPlaceholder, { backgroundColor: colors.border }]}>
                      <Ionicons name="home" size={24} color={colors.placeholder} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={1}>
                      {conversation.listing.title}
                    </Text>
                    <Text style={[styles.propertySub, { color: colors.placeholder }]}>
                      Tap to view listing details
                    </Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Details & Metadata Grid */}
            <View style={[styles.sectionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>CONVERSATION DETAILS</Text>
              
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.placeholder }]}>Total Messages</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{messagesCount}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.placeholder }]}>Last Activity</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleString() : 'Recent'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.placeholder }]}>Channel Type</Text>
                <Text style={[styles.metaValue, { color: colors.primary, fontWeight: '600' }]}>
                  {conversation.conversationKind === 'listing_human' ? 'Listing Inquiry' : 'Direct Message'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10, marginTop: 4 }}>
              {onViewStarred && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onViewStarred();
                  }}
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#261c0d' : '#fefce8', borderColor: '#f59e0b' }]}
                  accessibilityRole="button"
                  accessibilityLabel="View Starred Messages"
                >
                  <Ionicons name="star-outline" size={20} color="#f59e0b" style={{ marginRight: 8 }} />
                  <Text style={[styles.actionBtnText, { color: isDark ? '#fbbf24' : '#b45309' }]}>Starred Messages</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onAddAsLead();
                }}
                style={[styles.actionBtn, { backgroundColor: isDark ? '#262626' : '#fdf3f5', borderColor: colors.primary }]}
              >
                <Ionicons name="person-add-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Add as CRM Lead</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onToggleArchive();
                }}
                style={[styles.actionBtn, { backgroundColor: isDark ? '#1c1c1e' : '#f3f4f6', borderColor: colors.border }]}
              >
                <Ionicons name="archive-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>
                  {conversation.isArchived ? 'Unarchive Conversation' : 'Archive Conversation'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    height: '75%',
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarInitials: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: 0.5,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  propertyThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  propertyThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  propertySub: {
    fontSize: 11.5,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});

export default ChatInfoModal;
