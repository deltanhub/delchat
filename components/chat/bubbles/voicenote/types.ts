import React from 'react';
import { ChatMessage } from '../types';
import { AudioPlayer } from 'expo-audio';

export interface VoiceNoteBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
  onLongPressMessage?: (message: ChatMessage) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onOpenFullEmojiPicker?: () => void;
}

export type PlaybackSpeed = 1 | 1.5 | 2;

export interface VoiceNotePlayerState {
  isPlaying: boolean;
  playbackSeconds: number;
  playbackSpeed: PlaybackSpeed;
  duration: number;
  activeBarsCount: number;
  audioUri: string | null;
  playerRef: React.MutableRefObject<AudioPlayer | null>;
  handleTogglePlay: () => Promise<void>;
  handleCycleSpeed: () => Promise<void>;
  formatAudioTime: (secs: number) => string;
}

export interface VoiceNotePlayButtonProps {
  player: VoiceNotePlayerState;
  isCurrentUser: boolean;
  isDark: boolean;
  primaryColor: string;
}

export interface VoiceNoteWaveformProps {
  player: VoiceNotePlayerState;
  isCurrentUser: boolean;
  isDark: boolean;
  primaryColor: string;
  placeholderColor: string;
  textColor: string;
}

export interface VoiceNoteQuotedReplyProps {
  replyTo: {
    authorName?: string;
    body?: string;
  };
  isCurrentUser: boolean;
  isDark: boolean;
  primaryColor: string;
  placeholderColor: string;
}

export interface VoiceNoteStatusFooterProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
  placeholderColor: string;
}

export interface VoiceNoteReactionMenuProps {
  showPopover: boolean;
  showFullPicker: boolean;
  isCurrentUser: boolean;
  isDark: boolean;
  cardColor: string;
  borderColor: string;
  textColor: string;
  onSelectEmoji: (emoji: string) => void;
  onOpenFullPicker: () => void;
  onClosePopover: () => void;
  onCloseFullPicker: () => void;
}
