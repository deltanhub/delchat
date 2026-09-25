import { useState, useCallback } from 'react';
import * as Haptics from '../../../lib/haptics';
import { fetchWithAuth } from '../../../lib/api-client';
import { DELTAN_INTELLIGENCE_ENDPOINT } from './constants';
import type { ChatMessage } from '../MessageBubble';

interface UseAskAIOptions {
  message: ChatMessage | null;
  onClose: () => void;
  onInsertToComposer: (text: string) => void;
}

export function useAskAI({ message, onClose, onInsertToComposer }: UseAskAIOptions) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const executeQuery = useCallback(async (fullQuery: string) => {
    if (!message) return;
    setLoading(true);
    setAiResponse(null);

    try {
      const responseJson = await fetchWithAuth(DELTAN_INTELLIGENCE_ENDPOINT, {
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
  }, [message]);

  const handleQuickAction = useCallback(async (promptPrefix: string) => {
    if (!message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await executeQuery(`${promptPrefix}\n\n"${message.body || ''}"`);
  }, [message, executeQuery]);

  const handleCustomSubmit = useCallback(async () => {
    if (!customPrompt.trim() || !message) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await executeQuery(`${customPrompt.trim()}\n\nContext Message:\n"${message.body || ''}"`);
  }, [customPrompt, message, executeQuery]);

  const handleClose = useCallback(() => {
    setCustomPrompt('');
    setAiResponse(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  const handleUseReply = useCallback(() => {
    if (!aiResponse) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onInsertToComposer(aiResponse);
    handleClose();
  }, [aiResponse, onInsertToComposer, handleClose]);

  return {
    customPrompt,
    setCustomPrompt,
    loading,
    aiResponse,
    handleQuickAction,
    handleCustomSubmit,
    handleUseReply,
    handleClose,
  };
}
