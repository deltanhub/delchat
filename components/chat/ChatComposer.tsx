import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, View, Keyboard } from 'react-native';
import * as Haptics from '../../lib/haptics';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  ChatAttachmentActionType,
  ChatComposerProps,
  useAudioRecording,
  useComposerKeyboard,
  ComposerAttachmentMenu,
  ComposerReplyBanner,
  ComposerRecordingBar,
  ComposerInputBar,
  ComposerDisabledBanner,
} from './composer';

export type { ChatAttachmentActionType, ChatComposerProps };

export default function ChatComposer({
  value,
  onChangeText,
  onSend,
  onSendVoiceNote,
  onSelectAttachment,
  canAssignAgent = false,
  replyingToMessage,
  onCancelReply,
  disabled = false,
  disabledNotice,
}: ChatComposerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const { bottomPadding, menuBottomOffset } = useComposerKeyboard();
  const recording = useAudioRecording(onSendVoiceNote);

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const toggleAttachmentMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setShowAttachmentMenu((prev) => !prev);
  };

  const handleSendPress = () => {
    if (value.trim() === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend();
  };

  if (disabled) {
    return (
      <ComposerDisabledBanner
        isDark={isDark}
        borderColor={colors.border}
        bottomPadding={bottomPadding}
        disabledNotice={disabledNotice}
      />
    );
  }

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderTopColor: isDark ? '#27272a' : colors.border,
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <ComposerAttachmentMenu
        visible={showAttachmentMenu}
        canAssignAgent={canAssignAgent}
        isDark={isDark}
        bottomOffset={menuBottomOffset}
        onSelect={(type) => {
          setShowAttachmentMenu(false);
          onSelectAttachment?.(type);
        }}
        onClose={() => setShowAttachmentMenu(false)}
      />

      {replyingToMessage && (
        <ComposerReplyBanner
          replyingToMessage={replyingToMessage}
          isDark={isDark}
          primaryColor={colors.primary}
          placeholderColor={colors.placeholder}
          onCancelReply={onCancelReply}
        />
      )}

      <View style={styles.container}>
        {recording.isRecording ? (
          <ComposerRecordingBar
            recordingSeconds={recording.recordingSeconds}
            textColor={colors.text}
            primaryColor={colors.primary}
            formatRecordTime={recording.formatRecordTime}
            onCancelRecording={() => recording.handleStopRecording(false)}
            onSendRecording={() => recording.handleStopRecording(true)}
          />
        ) : (
          <ComposerInputBar
            value={value}
            isDark={isDark}
            showAttachmentMenu={showAttachmentMenu}
            primaryColor={colors.primary}
            primarySoftColor={colors.primarySoft}
            textInputRef={textInputRef}
            onChangeText={onChangeText}
            onToggleAttachmentMenu={toggleAttachmentMenu}
            onSendPress={handleSendPress}
            onStartRecording={recording.handleStartRecording}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderTopWidth: 1,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
    justifyContent: 'center',
  },
});
