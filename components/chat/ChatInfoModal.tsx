import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  ChatInfoProfileCard,
  ChatInfoPropertySection,
  ChatInfoDetailsSection,
  ChatInfoActionButtons,
  styles,
} from './chat_info';
import type { ChatInfoModalProps } from './chat_info/types';

export type { ChatInfoModalProps };

export const ChatInfoModal: React.FC<ChatInfoModalProps> = ({
  visible,
  conversation,
  messagesCount,
  onClose,
  onAddAsLead,
  onToggleArchive,
  onViewStarred,
  onReportAgent,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  if (!visible || !conversation) return null;

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
            <ChatInfoProfileCard
              conversation={conversation}
              isDark={isDark}
            />

            <ChatInfoPropertySection
              conversation={conversation}
              onClose={onClose}
            />

            <ChatInfoDetailsSection
              conversation={conversation}
              messagesCount={messagesCount}
            />

            <ChatInfoActionButtons
              conversation={conversation}
              isDark={isDark}
              onClose={onClose}
              onAddAsLead={onAddAsLead}
              onToggleArchive={onToggleArchive}
              onViewStarred={onViewStarred}
              onReportAgent={onReportAgent}
            />
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};

export default ChatInfoModal;

/**
 * Invariants:
 * onReportAgent
 * Report Agent to Management
 */
