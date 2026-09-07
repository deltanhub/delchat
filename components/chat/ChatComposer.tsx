import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, View, Text, Platform, Keyboard, Modal, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as Haptics from '../../lib/haptics';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import Animated, { ZoomIn, ZoomOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import ScalePressable from '../ScalePressable';

export type ChatAttachmentActionType =
  | 'media'
  | 'photo'
  | 'document'
  | 'catalog'
  | 'form'
  | 'lead'
  | 'assign-agent'
  | 'embed';

interface ChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendVoiceNote?: (duration: number, audioUri?: string) => void;
  onSelectAttachment?: (type: ChatAttachmentActionType) => void;
  canAssignAgent?: boolean;
  replyingToMessage?: {
    id: string;
    authorName: string;
    body: string;
  } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  disabledNotice?: string;
}

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
  const insets = useSafeAreaInsets();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const recordingTimer = useRef<any>(null);
  const textInputRef = useRef<TextInput>(null);

  // Keyboard show/hide listeners
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Safe audio recorder unmount cleanup
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      // Only attempt to stop recorder if an active recording session was in-flight
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        try {
          const rec = recorderRef.current;
          if (rec) {
            Promise.resolve(rec.stop()).catch(() => {});
          }
        } catch {
          // Native shared object may have already been released by ExpoModulesCore
        }
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone Access Required', 'Please enable microphone access in settings to record voice notes.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingSeconds(0);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('[ChatComposer] Error starting recording:', err);
      Alert.alert('Recording Error', 'Unable to start audio recording on this device.');
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const handleStopRecording = async (send: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const wasRecording = isRecordingRef.current;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }

    let recordedUri: string | null = null;
    const finalDuration = Math.max(1, recordingSeconds);

    if (wasRecording) {
      try {
        let isNativeRecording = false;
        try {
          // Safely evaluate getter in case native shared object is already released
          isNativeRecording = Boolean(recorder && recorder.isRecording);
        } catch {
          isNativeRecording = false;
        }

        if (isNativeRecording) {
          await recorder.stop().catch(() => {});
        }

        try {
          recordedUri = recorder.uri || null;
        } catch {
          recordedUri = null;
        }

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        }).catch(() => {});
      } catch (err) {
        console.warn('[ChatComposer] Error stopping recording:', err);
      }
    }

    if (send && onSendVoiceNote && finalDuration > 0) {
      onSendVoiceNote(finalDuration, recordedUri || undefined);
    }
    setRecordingSeconds(0);
  };

  const formatRecordTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleAttachmentMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setShowAttachmentMenu((prev) => !prev);
  };

  const handleAttachmentSelect = (type: ChatAttachmentActionType) => {
    setShowAttachmentMenu(false);
    if (onSelectAttachment) {
      onSelectAttachment(type);
    }
  };

  const handleSendPress = () => {
    if (value.trim() === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend();
  };

  const iconActiveColor = isDark ? '#ffffff' : colors.primary;
  const iconMutedColor = isDark ? '#ffffff' : colors.primary;

  const bottomPadding = isKeyboardVisible
    ? (Platform.OS === 'ios' ? 8 : 4)
    : Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8);

  const attachmentOptions: Array<{
    key: ChatAttachmentActionType;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    lightBg: string;
    darkBg: string;
    lightColor: string;
    darkColor: string;
    visible?: boolean;
  }> = [
    {
      key: 'media',
      title: 'Photos & videos',
      description: 'Send listing media and clips',
      icon: 'videocam-outline',
      lightBg: '#eaf5e8',
      darkBg: '#142918',
      lightColor: '#2f9b5f',
      darkColor: '#4ade80',
    },
    {
      key: 'document',
      title: 'Documents',
      description: 'Share brochures, PDFs & contracts',
      icon: 'document-text-outline',
      lightBg: '#efeafe',
      darkBg: '#241a3c',
      lightColor: '#7a55d8',
      darkColor: '#a78bfa',
    },
    {
      key: 'catalog',
      title: 'Catalog',
      description: 'Attach property from listings',
      icon: 'home-outline',
      lightBg: '#fdf3e7',
      darkBg: '#36210f',
      lightColor: '#d97706',
      darkColor: '#fbbf24',
    },
    {
      key: 'form',
      title: 'Send Form',
      description: 'Insert custom inquiry form',
      icon: 'calendar-outline',
      lightBg: '#fdf6f8',
      darkBg: '#2b0d16',
      lightColor: '#4a0f1f',
      darkColor: '#f472b6',
    },
    {
      key: 'lead',
      title: 'Create lead',
      description: 'Capture a new contact from chat',
      icon: 'person-add-outline',
      lightBg: '#f6ebee',
      darkBg: '#2b0d16',
      lightColor: '#4a0f1f',
      darkColor: '#f472b6',
    },
    {
      key: 'assign-agent',
      title: 'Assign Agent',
      description: 'Delegate to a team agent',
      icon: 'people-outline',
      lightBg: '#eaf0fb',
      darkBg: '#152338',
      lightColor: '#4a6b9a',
      darkColor: '#60a5fa',
      visible: canAssignAgent,
    },
    {
      key: 'embed',
      title: '3D Tour / Embed code',
      description: 'Paste iframe or viewer URL',
      icon: 'cube-outline',
      lightBg: '#eaf0fb',
      darkBg: '#152338',
      lightColor: '#4a6b9a',
      darkColor: '#60a5fa',
    },
  ];

  if (disabled) {
    return (
      <View
        style={[
          styles.outerContainer,
          {
            borderTopColor: isDark ? '#27272a' : colors.border,
            backgroundColor: isDark ? '#18181b' : '#f8fbfe',
            paddingBottom: bottomPadding,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '90%' }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#5C1324', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="megaphone" size={10} color="#ffffff" />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a1a1aa' : '#5c7089', textAlign: 'center', flexShrink: 1 }}>
            {disabledNotice || 'This is an official announcement channel from DELTANHUB. Replies are disabled.'}
          </Text>
        </View>
      </View>
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
      {/* Floating Attachment Menu Modal Popup */}
      <Modal
        visible={showAttachmentMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setShowAttachmentMenu(false)}>
          <Animated.View
            entering={SlideInDown.springify().damping(16).mass(0.9)}
            exiting={SlideOutDown.duration(150)}
            style={[
              styles.floatingMenuCard,
              {
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: isDark ? '#27272a' : 'rgba(0, 0, 0, 0.08)',
                bottom: Math.max(insets.bottom, 16) + 54,
              },
            ]}
          >
            {attachmentOptions
              .filter((opt) => opt.visible !== false)
              .map((item) => (
                <ScalePressable
                  key={item.key}
                  style={styles.menuRowItem}
                  onPress={() => handleAttachmentSelect(item.key)}
                >
                  <View
                    style={[
                      styles.menuIconCircle,
                      { backgroundColor: isDark ? item.darkBg : item.lightBg },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isDark ? item.darkColor : item.lightColor}
                    />
                  </View>
                  <View style={styles.menuTextCol}>
                    <Text style={[styles.menuTitleText, { color: isDark ? '#ffffff' : '#101828' }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuDescText, { color: isDark ? '#9ca3af' : '#667085' }]}>
                      {item.description}
                    </Text>
                  </View>
                </ScalePressable>
              ))}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* WhatsApp-Style Replying Banner */}
      {replyingToMessage && (
        <View
          style={[
            styles.replyBanner,
            {
              backgroundColor: isDark ? '#18181b' : '#f8fafc',
              borderLeftColor: colors.primary,
              borderColor: isDark ? '#27272a' : '#e2e8f0',
            },
          ]}
        >
          <View style={styles.replyContentCol}>
            <Text style={[styles.replyAuthorText, { color: isDark ? '#ffffff' : colors.primary }]}>
              Replying to {replyingToMessage.authorName}
            </Text>
            <Text style={[styles.replySnippetText, { color: colors.placeholder }]} numberOfLines={1}>
              {replyingToMessage.body || 'Attachment'}
            </Text>
          </View>
          <ScalePressable
            onPress={onCancelReply}
            accessibilityLabel="Cancel replying"
            accessibilityRole="button"
            accessibilityHint="Dismisses the quoted reply"
            style={styles.replyDismissBtn}
          >
            <Ionicons name="close-circle" size={20} color={colors.placeholder} />
          </ScalePressable>
        </View>
      )}

      {/* Main Composer Bar */}
      <View style={styles.container}>
        {isRecording ? (
          /* Audio Recording View */
          <View style={styles.recordingRow}>
            <View style={styles.recordingIndicatorCol}>
              <View style={[styles.recordDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.recordingTime, { color: colors.text }]}>
                Recording {formatRecordTime(recordingSeconds)}
              </Text>
            </View>

            <View style={styles.recordingActionsCol}>
              <ScalePressable
                onPress={() => handleStopRecording(false)}
                accessibilityLabel="Cancel recording"
                accessibilityRole="button"
                accessibilityHint="Discards the recorded audio"
                style={styles.recordActionBtn}
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
              </ScalePressable>

              <ScalePressable
                onPress={() => handleStopRecording(true)}
                accessibilityLabel="Send voice note"
                accessibilityRole="button"
                accessibilityHint="Sends the recorded voice note"
                style={[styles.recordSendBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="arrow-up" size={22} color="#ffffff" />
              </ScalePressable>
            </View>
          </View>
        ) : (
          /* Normal Message Input View */
          <View style={styles.inputRow}>
            {/* Bold Attachment Button */}
            <ScalePressable
              onPress={toggleAttachmentMenu}
              accessibilityLabel="Attachment options"
              accessibilityRole="button"
              accessibilityHint="Shows menu to attach photos, videos, documents, or listings"
              style={[
                styles.iconButton,
                { backgroundColor: showAttachmentMenu ? (isDark ? '#27272a' : '#f4f4f5') : 'transparent' },
              ]}
            >
              <Ionicons
                name="attach"
                size={26}
                color={showAttachmentMenu ? iconActiveColor : (isDark ? '#ffffff' : colors.primary)}
              />
            </ScalePressable>

            {/* Bolder TextInput */}
            <TextInput
              ref={textInputRef}
              accessibilityLabel="Type a message"
              accessibilityHint="Double tap to enter message text"
              style={[
                styles.textInput,
                {
                  color: isDark ? '#ffffff' : '#0f172a',
                  backgroundColor: isDark ? '#1c1c1e' : '#f4f6f8',
                  borderColor: isDark ? '#2c2c2e' : '#e2e8f0',
                },
              ]}
              placeholder="Write a message..."
              placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
              value={value}
              onChangeText={onChangeText}
              multiline
              maxLength={1000}
            />

            {value.trim() !== '' ? (
              /* Bold Send Text Button */
              <Animated.View entering={ZoomIn.duration(200).springify().damping(14)} exiting={ZoomOut.duration(150)}>
                <ScalePressable
                  onPress={handleSendPress}
                  accessibilityLabel="Send message"
                  accessibilityRole="button"
                  accessibilityHint="Transmits the message to the conversation"
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="arrow-up" size={20} color="#ffffff" />
                </ScalePressable>
              </Animated.View>
            ) : (
              /* Bold Solid Microphone Voice Note Button */
              <Animated.View entering={ZoomIn.duration(200).springify().damping(14)} exiting={ZoomOut.duration(150)}>
                <ScalePressable
                  onPress={handleStartRecording}
                  accessibilityLabel="Record voice note"
                  accessibilityRole="button"
                  accessibilityHint="Double tap to start recording an audio message"
                  style={[
                    styles.micButton,
                    { backgroundColor: isDark ? '#27272a' : colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name="mic"
                    size={21}
                    color={isDark ? '#ffffff' : colors.primary}
                  />
                </ScalePressable>
              </Animated.View>
            )}
          </View>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  micButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 6,
  },
  recordingIndicatorCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingTime: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  recordingActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  recordSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentDrawer: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  drawerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 14,
  },
  drawerItem: {
    width: '25%',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  drawerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  floatingMenuCard: {
    position: 'absolute',
    left: 12,
    width: 290,
    maxWidth: '86%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 12,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitleText: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    lineHeight: 18,
  },
  menuDescText: {
    fontSize: 11,
    marginTop: 1,
    fontFamily: Typography.fontFamily,
    lineHeight: 14,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  replyContentCol: {
    flex: 1,
    marginRight: 8,
  },
  replyAuthorText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  replySnippetText: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  replyDismissBtn: {
    padding: 4,
  },
});
