import React, { useState } from 'react';
import { StyleSheet, Text, View, Platform, Modal, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';

interface ChatHeaderProps {
  partnerName: string;
  partnerAvatarUrl: string | null;
  subtitle: string;
  isTyping: boolean;
  isOnline?: boolean;
  lastSeenText?: string | null;
  canSendMessages: boolean;
  onBack: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
  onAddAsLead?: () => void;
  onToggleArchive?: () => void;
  onOpenChatInfo?: () => void;
  onToggleMute?: () => void;
  onToggleBlock?: () => void;
  onReportAgent?: () => void;
  onManageAssignment?: () => void;
  onViewStarred?: () => void;
  onOpenInternalNotes?: () => void;
  presenceStatus?: 'available' | 'busy' | 'away';
  isArchived?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  hasAssignment?: boolean;
  canManageAssignment?: boolean;
  canReportAgent?: boolean;
  isGroup?: boolean;
  participantCount?: number;
  participantNames?: string[];
}

export default function ChatHeader({
  partnerName,
  partnerAvatarUrl,
  subtitle,
  isTyping,
  isOnline = false,
  lastSeenText = null,
  canSendMessages,
  onBack,
  onAudioCall,
  onVideoCall,
  onAddAsLead,
  onToggleArchive,
  onOpenChatInfo,
  onToggleMute,
  onToggleBlock,
  onReportAgent,
  onManageAssignment,
  onViewStarred,
  onOpenInternalNotes,
  presenceStatus,
  isArchived = false,
  isMuted = false,
  isBlocked = false,
  hasAssignment = false,
  canManageAssignment = false,
  canReportAgent = false,
  isGroup = false,
  participantCount,
  participantNames,
}: ChatHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [menuVisible, setMenuVisible] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleMenuOption = (callback?: () => void) => {
    setMenuVisible(false);
    if (callback) callback();
  };

  const headerIconColor = isDark ? '#ffffff' : colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {/* Left section: Back button & Profile details */}
        <View style={styles.leftSection}>
          <ScalePressable onPress={onBack} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={headerIconColor} />
          </ScalePressable>

          <View style={styles.avatarCol}>
            {isGroup ? (
              <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#3d1624' : '#fcedf2' }]}>
                <Ionicons name="people" size={20} color={colors.primary} />
              </View>
            ) : partnerAvatarUrl ? (
              <View style={styles.avatarFrame}>
                <Image
                  source={{ uri: partnerAvatarUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}>
                <Text style={[styles.avatarInitialsText, { color: isDark ? '#ffffff' : colors.primary }]}>
                  {getInitials(partnerName)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.detailsCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={[styles.partnerNameText, { color: colors.text }]} numberOfLines={1}>
                {partnerName}
              </Text>
              {presenceStatus && (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor:
                      presenceStatus === 'available'
                        ? '#16a34a'
                        : presenceStatus === 'busy'
                        ? '#d97706'
                        : '#64748b',
                  }}
                  accessibilityLabel={`Status: ${presenceStatus}`}
                />
              )}
              {isGroup && typeof participantCount === 'number' && participantCount > 0 && (
                <View style={[styles.groupBadge, { backgroundColor: isDark ? '#27272a' : '#f4e7eb' }]}>
                  <Text style={[styles.groupBadgeText, { color: colors.primary }]}>
                    {participantCount} members
                  </Text>
                </View>
              )}
              {(partnerName.toUpperCase() === 'DELTANHUB' || partnerName.toUpperCase() === 'DELTANHUB SUPPORT') && (
                <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: '#5C1324', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={10} color="#ffffff" />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.statusText,
                {
                  color: (isTyping || isOnline)
                    ? (isDark ? '#34d399' : '#059669')
                    : (isDark ? '#9ca3af' : colors.placeholder),
                },
              ]}
              numberOfLines={1}
            >
              {isTyping
                ? 'typing...'
                : isOnline
                ? 'online'
                : isGroup && participantNames && participantNames.length > 0
                ? participantNames.join(', ')
                : (lastSeenText || subtitle)}
            </Text>
          </View>
        </View>

        {/* Right section: Call icons & dropdown menu */}
        <View style={styles.rightSection}>
          <ScalePressable
            onPress={onAudioCall}
            disabled={!canSendMessages}
            style={[styles.iconButton, !canSendMessages && styles.disabledBtn]}
          >
            <Ionicons name="call-outline" size={22} color={headerIconColor} />
          </ScalePressable>

          <ScalePressable
            onPress={onVideoCall}
            disabled={!canSendMessages}
            style={[styles.iconButton, !canSendMessages && styles.disabledBtn]}
          >
            <Ionicons name="videocam-outline" size={22} color={headerIconColor} />
          </ScalePressable>

          <ScalePressable onPress={() => setMenuVisible(true)} style={styles.iconButton}>
            <Ionicons name="ellipsis-vertical" size={22} color={headerIconColor} />
          </ScalePressable>
        </View>
      </View>

      {/* Pop-up Options Modal */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View
            style={[
              styles.dropdownMenu,
              {
                top: insets.top + (Platform.OS === 'ios' ? 52 : 48),
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {onAddAsLead && (
              <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleMenuOption(onAddAsLead)}>
                <Ionicons name="person-add-outline" size={17} color={colors.text} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Add as Lead</Text>
              </Pressable>
            )}

            {onToggleArchive && (
              <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleMenuOption(onToggleArchive)}>
                <Ionicons name="archive-outline" size={17} color={colors.text} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
                </Text>
              </Pressable>
            )}

            {onOpenChatInfo && (
              <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleMenuOption(onOpenChatInfo)}>
                <Ionicons name="information-circle-outline" size={17} color={colors.text} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Chat Info</Text>
              </Pressable>
            )}

            {onViewStarred && (
              <Pressable
                style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => handleMenuOption(onViewStarred)}
                accessibilityRole="button"
                accessibilityLabel="View starred messages"
              >
                <Ionicons name="star-outline" size={17} color="#f59e0b" style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Starred Messages</Text>
              </Pressable>
            )}

            {onOpenInternalNotes && (
              <Pressable
                style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => handleMenuOption(onOpenInternalNotes)}
                accessibilityRole="button"
                accessibilityLabel="Internal team notes"
              >
                <Ionicons name="lock-closed-outline" size={17} color="#f59e0b" style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Internal Notes</Text>
              </Pressable>
            )}

            {onToggleMute && (
              <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleMenuOption(onToggleMute)}>
                <Ionicons name={isMuted ? 'volume-high-outline' : 'volume-mute-outline'} size={17} color={colors.text} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {isMuted ? 'Unmute Chat' : 'Mute Notifications'}
                </Text>
              </Pressable>
            )}

            {onManageAssignment && (
              <Pressable
                style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => handleMenuOption(onManageAssignment)}
                accessibilityRole="button"
                accessibilityLabel="Manage lead assignment"
              >
                <Ionicons name="people-outline" size={17} color={colors.text} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Manage Assignment</Text>
              </Pressable>
            )}

            {Boolean((hasAssignment || canReportAgent) && onReportAgent) && (
              <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleMenuOption(onReportAgent)}>
                <Ionicons name="flag-outline" size={17} color="#ef4444" style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Report Agent</Text>
              </Pressable>
            )}

            {onToggleBlock && (
              <Pressable style={[styles.menuItem, styles.lastItem]} onPress={() => handleMenuOption(onToggleBlock)}>
                <Ionicons name="ban-outline" size={17} color="#ef4444" style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: '#ef4444' }]}>
                  {isBlocked ? 'Unblock Contact' : 'Block Contact'}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  avatarCol: {
    marginHorizontal: 4,
    position: 'relative',
  },
  avatarFrame: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatar: {
    width: 38,
    height: 38,
  },
  avatarInitialsMock: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  detailsCol: {
    flex: 1,
    marginLeft: 6,
    justifyContent: 'center',
  },
  partnerNameText: {
    fontSize: 15,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
    flexShrink: 1,
  },
  groupBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 16,
    width: 170,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },
});
