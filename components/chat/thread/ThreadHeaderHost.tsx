import React from 'react';
import ChatHeader from '../ChatHeader';
import ChatToast from '../ChatToast';
import ConnectionBanner from '../ConnectionBanner';

export interface ThreadHeaderHostProps {
  session: any;
  partnerNameParam?: string;
  effectiveSubtitle: string;
  isPartnerTyping: boolean;
  isPartnerOnline: boolean;
  lastSeenText: string;
  onStartCall: (kind: 'audio' | 'video') => void;
  modals: any;
  colors: any;
  isDark: boolean;
  onBack: () => void;
}

export function ThreadHeaderHost({
  session,
  partnerNameParam,
  effectiveSubtitle,
  isPartnerTyping,
  isPartnerOnline,
  lastSeenText,
  onStartCall,
  modals,
  colors,
  isDark,
  onBack,
}: ThreadHeaderHostProps) {
  const conv = session.conversation;

  return (
    <>
      <ChatHeader
        partnerName={conv?.partnerName || partnerNameParam || 'Loading...'}
        partnerAvatarUrl={conv?.partnerAvatarUrl || null}
        subtitle={effectiveSubtitle}
        isTyping={isPartnerTyping}
        isOnline={isPartnerOnline}
        lastSeenText={lastSeenText}
        canSendMessages={!conv?.isBlocked}
        isArchived={Boolean(conv?.isArchived)}
        isMuted={Boolean(conv?.isMuted)}
        isBlocked={Boolean(conv?.isBlocked)}
        onBack={onBack}
        onAudioCall={() => onStartCall('audio')}
        onVideoCall={() => onStartCall('video')}
        onOpenChatInfo={() => modals.openModal('chat_info')}
        onViewStarred={() => modals.openModal('starred')}
        onOpenInternalNotes={() => modals.openModal('internal_notes')}
        onAddAsLead={() => modals.openModal('lead_capture')}
        onToggleArchive={session.handleToggleArchive}
        onToggleMute={session.handleToggleMute}
        onToggleBlock={session.handleToggleBlock}
        onReportAgent={() => modals.openModal('report')}
        onManageAssignment={() => modals.openModal('assignment')}
        canManageAssignment={Boolean(conv?.canAssignAgents)}
        hasAssignment={Boolean(conv?.assignment)}
        canReportAgent={Boolean(
          session.canReportAgent ||
            conv?.assignedAgent ||
            conv?.inquiryId
        )}
        isGroup={conv?.isGroup || false}
        participantCount={conv?.participantCount}
      />
      <ChatToast message={session.toastMessage} onDismiss={session.dismissToast} />
      <ConnectionBanner />
    </>
  );
}
