import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  ChatHeaderLeft,
  ChatHeaderRight,
  ChatHeaderDropdownMenu,
  styles,
} from './header';
import type { ChatHeaderProps } from './header/types';

export type { ChatHeaderProps };

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
        <ChatHeaderLeft
          partnerName={partnerName}
          partnerAvatarUrl={partnerAvatarUrl}
          subtitle={subtitle}
          isTyping={isTyping}
          isOnline={isOnline}
          lastSeenText={lastSeenText}
          presenceStatus={presenceStatus}
          isGroup={isGroup}
          participantCount={participantCount}
          participantNames={participantNames}
          isDark={isDark}
          onBack={onBack}
        />

        <ChatHeaderRight
          canSendMessages={canSendMessages}
          isDark={isDark}
          onAudioCall={onAudioCall}
          onVideoCall={onVideoCall}
          onOpenMenu={() => setMenuVisible(true)}
        />
      </View>

      {/* Pop-up Options Modal: supports Report Agent, Add Lead, Starred, Notes, Assignment */}
      <ChatHeaderDropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        topInset={insets.top}
        isDark={isDark}
        isArchived={isArchived}
        isMuted={isMuted}
        isBlocked={isBlocked}
        hasAssignment={hasAssignment}
        canReportAgent={canReportAgent}
        onAddAsLead={onAddAsLead}
        onToggleArchive={onToggleArchive}
        onOpenChatInfo={onOpenChatInfo}
        onViewStarred={onViewStarred}
        onOpenInternalNotes={onOpenInternalNotes}
        onToggleMute={onToggleMute}
        onManageAssignment={onManageAssignment}
        onReportAgent={onReportAgent}
        onToggleBlock={onToggleBlock}
      />
    </View>
  );
}
