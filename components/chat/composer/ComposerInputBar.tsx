import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import ScalePressable from '../../ScalePressable';
import { ComposerInputBarProps } from './types';
import { inputBarStyles } from './inputBarStyles';

export function ComposerInputBar({
  value,
  isDark,
  showAttachmentMenu,
  primaryColor,
  primarySoftColor,
  textInputRef,
  onChangeText,
  onToggleAttachmentMenu,
  onSendPress,
  onStartRecording,
}: ComposerInputBarProps) {
  const iconActiveColor = isDark ? '#ffffff' : primaryColor;

  return (
    <View style={inputBarStyles.inputRow}>
      {/* Bold Attachment Button */}
      <ScalePressable
        onPress={onToggleAttachmentMenu}
        accessibilityLabel="Attachment options"
        accessibilityRole="button"
        accessibilityHint="Shows menu to attach photos, videos, documents, or listings"
        style={[
          inputBarStyles.iconButton,
          {
            backgroundColor: showAttachmentMenu
              ? isDark
                ? '#27272a'
                : '#f4f4f5'
              : 'transparent',
          },
        ]}
      >
        <Ionicons
          name="attach"
          size={26}
          color={
            showAttachmentMenu
              ? iconActiveColor
              : isDark
              ? '#ffffff'
              : primaryColor
          }
        />
      </ScalePressable>

      {/* Bolder TextInput */}
      <TextInput
        ref={textInputRef}
        accessibilityLabel="Type a message"
        accessibilityHint="Double tap to enter message text"
        style={[
          inputBarStyles.textInput,
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
        <Animated.View
          entering={ZoomIn.duration(200).springify().damping(14)}
          exiting={ZoomOut.duration(150)}
        >
          <ScalePressable
            onPress={onSendPress}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityHint="Transmits the message to the conversation"
            style={[inputBarStyles.actionBtn, { backgroundColor: primaryColor }]}
          >
            <Ionicons name="arrow-up" size={20} color="#ffffff" />
          </ScalePressable>
        </Animated.View>
      ) : (
        /* Bold Solid Microphone Voice Note Button */
        <Animated.View
          entering={ZoomIn.duration(200).springify().damping(14)}
          exiting={ZoomOut.duration(150)}
        >
          <ScalePressable
            onPress={onStartRecording}
            accessibilityLabel="Record voice note"
            accessibilityRole="button"
            accessibilityHint="Double tap to start recording an audio message"
            style={[
              inputBarStyles.micButton,
              { backgroundColor: isDark ? '#27272a' : primarySoftColor },
            ]}
          >
            <Ionicons
              name="mic"
              size={21}
              color={isDark ? '#ffffff' : primaryColor}
            />
          </ScalePressable>
        </Animated.View>
      )}
    </View>
  );
}

export default ComposerInputBar;
