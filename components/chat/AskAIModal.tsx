import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import {
  AskAIHeader,
  AskAIContextCard,
  AskAIQuickActions,
  AskAIResponseCard,
  useAskAI,
  styles,
  QUICK_ACTIONS,
  DELTAN_INTELLIGENCE_ENDPOINT,
} from './ask_ai';
import type { AskAIModalProps } from './ask_ai/types';

export type { AskAIModalProps };

/**
 * AskAIModal connects to the live Deltan Intelligence endpoint:
 * /api/deltan-intelligence/chat-mention
 */
export default function AskAIModal({
  visible,
  message,
  onClose,
  onInsertToComposer,
}: AskAIModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    customPrompt,
    setCustomPrompt,
    loading,
    aiResponse,
    handleQuickAction,
    handleCustomSubmit,
    handleUseReply,
    handleClose,
  } = useAskAI({ message, onClose, onInsertToComposer });

  if (!message) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Pressable
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#141416' : '#ffffff',
                borderColor: isDark ? '#27272a' : colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <AskAIHeader isDark={isDark} onClose={handleClose} />

            <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
              <AskAIContextCard messageBody={message.body} isDark={isDark} />

              <AskAIQuickActions
                actions={QUICK_ACTIONS}
                isDark={isDark}
                onSelectAction={handleQuickAction}
              />

              <View style={styles.customInputRow}>
                <TextInput
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                  placeholder="Ask a specific question to AI..."
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: isDark ? '#1c1c1f' : '#f8fafc',
                      borderColor: isDark ? '#2e2e33' : colors.border,
                      color: colors.text,
                    },
                  ]}
                  returnKeyType="send"
                  onSubmitEditing={handleCustomSubmit}
                />
                <ScalePressable
                  onPress={handleCustomSubmit}
                  style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Send question to AI"
                >
                  <Ionicons name="arrow-up" size={18} color="#ffffff" />
                </ScalePressable>
              </View>

              {loading && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.placeholder }]}>
                    Deltan AI is generating response...
                  </Text>
                </View>
              )}

              {aiResponse && (
                <AskAIResponseCard
                  response={aiResponse}
                  isDark={isDark}
                  onInsert={handleUseReply}
                />
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
