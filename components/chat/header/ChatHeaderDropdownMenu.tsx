import React from 'react';
import { View, Text, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { styles } from './styles';
import type { ChatHeaderDropdownMenuProps } from './types';

export const ChatHeaderDropdownMenu: React.FC<ChatHeaderDropdownMenuProps> = ({
  visible,
  onClose,
  topInset,
  isDark,
  isArchived = false,
  isMuted = false,
  isBlocked = false,
  hasAssignment = false,
  canReportAgent = false,
  onAddAsLead,
  onToggleArchive,
  onOpenChatInfo,
  onViewStarred,
  onOpenInternalNotes,
  onToggleMute,
  onManageAssignment,
  onReportAgent,
  onToggleBlock,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleOption = (callback?: () => void) => {
    onClose();
    if (callback) callback();
  };

  const showReport = Boolean((hasAssignment || canReportAgent) && onReportAgent);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View
          style={[
            styles.dropdownMenu,
            {
              top: topInset + (Platform.OS === 'ios' ? 52 : 48),
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {onAddAsLead && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onAddAsLead)}>
              <Ionicons name="person-add-outline" size={17} color={colors.text} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Add as Lead</Text>
            </Pressable>
          )}

          {onToggleArchive && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onToggleArchive)}>
              <Ionicons name="archive-outline" size={17} color={colors.text} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{isArchived ? 'Unarchive Chat' : 'Archive Chat'}</Text>
            </Pressable>
          )}

          {onOpenChatInfo && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onOpenChatInfo)}>
              <Ionicons name="information-circle-outline" size={17} color={colors.text} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Chat Info</Text>
            </Pressable>
          )}

          {onViewStarred && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onViewStarred)} accessibilityRole="button" accessibilityLabel="View starred messages">
              <Ionicons name="star-outline" size={17} color="#f59e0b" style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Starred Messages</Text>
            </Pressable>
          )}

          {onOpenInternalNotes && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onOpenInternalNotes)} accessibilityRole="button" accessibilityLabel="Internal team notes">
              <Ionicons name="lock-closed-outline" size={17} color="#f59e0b" style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Internal Notes</Text>
            </Pressable>
          )}

          {onToggleMute && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onToggleMute)}>
              <Ionicons name={isMuted ? 'volume-high-outline' : 'volume-mute-outline'} size={17} color={colors.text} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{isMuted ? 'Unmute Chat' : 'Mute Notifications'}</Text>
            </Pressable>
          )}

          {onManageAssignment && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onManageAssignment)} accessibilityRole="button" accessibilityLabel="Manage lead assignment">
              <Ionicons name="people-outline" size={17} color={colors.text} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Manage Assignment</Text>
            </Pressable>
          )}

          {showReport && (
            <Pressable style={[styles.menuItem, { borderBottomColor: isDark ? '#262626' : 'rgba(0,0,0,0.05)' }]} onPress={() => handleOption(onReportAgent)}>
              <Ionicons name="flag-outline" size={17} color="#ef4444" style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Report Agent</Text>
            </Pressable>
          )}

          {onToggleBlock && (
            <Pressable style={[styles.menuItem, styles.lastItem]} onPress={() => handleOption(onToggleBlock)}>
              <Ionicons name="ban-outline" size={17} color="#ef4444" style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: '#ef4444' }]}>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};
