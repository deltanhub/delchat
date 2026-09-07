import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
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
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';
import { fetchWithAuth } from '../../lib/api-client';
import type { ChatMessage } from './MessageBubble';

interface AskAIModalProps {
  visible: boolean;
  message: ChatMessage | null;
  onClose: () => void;
  onInsertToComposer: (text: string) => void;
}

const QUICK_ACTIONS = [
  {
    id: 'reply',
    title: 'Draft Reply',
    icon: 'chatbubble-ellipses-outline' as const,
    prompt: 'Draft a polite, professional, and persuasive real estate response to this message:',
  },
  {
    id: 'explain',
    title: 'Explain Terms',
    icon: 'bulb-outline' as const,
    prompt: 'Explain any real estate terms, legal nuances, or financing conditions mentioned in this message clearly:',
  },
  {
    id: 'summarize',
    title: 'Summarize',
    icon: 'list-outline' as const,
    prompt: 'Summarize the core request, action items, and next steps from this client message:',
  },
  {
    id: 'negotiate',
    title: 'Offer Advice',
    icon: 'trending-up-outline' as const,
    prompt: 'Provide strategic advice for negotiating the price or conditions discussed in this message:',
  },
];

export default function AskAIModal({
  visible,
  message,
  onClose,
  onInsertToComposer,
}: AskAIModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleQuickAction = async (promptPrefix: string) => {
    if (!message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await executeQuery(promptPrefix + '\n\n"' + (message.body || '') + '"');
  };

  const handleCustomSubmit = async () => {
    if (!customPrompt.trim() || !message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await executeQuery(customPrompt.trim() + '\n\nContext Message:\n"' + (message.body || '') + '"');
  };

  const executeQuery = async (fullQuery: string) => {
    if (!message) return;
    setLoading(true);
    setAiResponse(null);

    try {
      const responseJson = await fetchWithAuth('/api/deltan-intelligence/chat-mention', {
        method: 'POST',
        body: JSON.stringify({
          message: fullQuery,
          conversationId: message.id,
        }),
      });

      const reply =
        responseJson?.reply ||
        responseJson?.answer ||
        responseJson?.response ||
        responseJson?.text ||
        responseJson?.content ||
        responseJson?.message ||
        (typeof responseJson?.data === 'string'
          ? responseJson.data
          : responseJson?.data?.reply || responseJson?.data?.text);

      if (reply && typeof reply === 'string') {
        setAiResponse(reply.trim());
      } else {
        throw new Error('Deltan Intelligence returned an empty response.');
      }
    } catch (err: any) {
      console.warn('[AskAIModal] Deltan Intelligence request failed:', err);
      setAiResponse(
        err?.message || 'Unable to connect to Deltan Intelligence. Please check your network connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseReply = () => {
    if (!aiResponse) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onInsertToComposer(aiResponse);
    handleClose();
  };

  const handleClose = () => {
    setCustomPrompt('');
    setAiResponse(null);
    setLoading(false);
    onClose();
  };

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
            <View style={[styles.header, { borderBottomColor: isDark ? '#27272a' : colors.border }]}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.sparkleBadge, { backgroundColor: isDark ? '#3d1624' : '#fcedf2' }]}>
                  <Ionicons name="sparkles" size={16} color={isDark ? '#f4a5b8' : colors.primary} />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Deltan Intelligence</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
                    AI Real Estate Assistant
                  </Text>
                </View>
              </View>
              <ScalePressable onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.placeholder} />
              </ScalePressable>
            </View>

            <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
              <View
                style={[
                  styles.contextBox,
                  {
                    backgroundColor: isDark ? '#1f1f23' : '#f8fafc',
                    borderColor: isDark ? '#2e2e33' : '#e2e8f0',
                  },
                ]}
              >
                <Text style={[styles.contextLabel, { color: isDark ? '#f4a5b8' : colors.primary }]}>
                  Referenced Message:
                </Text>
                <Text style={[styles.contextText, { color: colors.text }]} numberOfLines={3}>
                  "{message.body || 'Attachment / Form'}"
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.placeholder }]}>Quick Actions</Text>
              <View style={styles.chipsRow}>
                {QUICK_ACTIONS.map((action) => (
                  <ScalePressable
                    key={action.id}
                    onPress={() => handleQuickAction(action.prompt)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isDark ? '#27272a' : '#f4e7eb',
                        borderColor: isDark ? '#3f3f46' : 'rgba(74, 15, 31, 0.15)',
                      },
                    ]}
                  >
                    <Ionicons name={action.icon} size={14} color={isDark ? '#f4a5b8' : colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.chipText, { color: isDark ? '#f4a5b8' : colors.primary }]}>{action.title}</Text>
                  </ScalePressable>
                ))}
              </View>

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
                <View
                  style={[
                    styles.responseCard,
                    {
                      backgroundColor: isDark ? '#1a1016' : '#fff5f7',
                      borderColor: isDark ? '#4a1525' : '#f7c5d2',
                    },
                  ]}
                >
                  <View style={styles.responseHeaderRow}>
                    <Ionicons name="sparkles" size={14} color={isDark ? '#f4a5b8' : colors.primary} />
                    <Text style={[styles.responseHeaderTitle, { color: isDark ? '#f4a5b8' : colors.primary }]}>
                      Suggested Answer
                    </Text>
                  </View>
                  <Text style={[styles.responseText, { color: colors.text }]}>{aiResponse}</Text>
                  <ScalePressable
                    onPress={handleUseReply}
                    style={[styles.insertBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.insertBtnText}>Insert into Message</Text>
                  </ScalePressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    maxHeight: 520,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  contextBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contextText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  responseCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  responseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  responseHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    textTransform: 'uppercase',
  },
  responseText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Typography.fontFamily,
  },
  insertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 4,
  },
  insertBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});
