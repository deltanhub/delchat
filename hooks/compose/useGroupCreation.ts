import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from '../../lib/haptics';
import { fetchWithAuth } from '../../lib/api-client';
import type { Contact, UseGroupCreationParams, UseGroupCreationReturn } from './types';

export function useGroupCreation({
  groupName,
  selectedContacts,
  onError,
}: UseGroupCreationParams): UseGroupCreationReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartDirectChat = useCallback(async (contact: Contact) => {
    setIsSubmitting(true);
    onError(null);
    try {
      const response = await fetchWithAuth('/api/chats/direct', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: contact.userId }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const convoId = response.conversation?.id;
      if (convoId) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        router.replace(`/thread/${convoId}`);
      } else {
        throw new Error('No conversation ID returned.');
      }
    } catch (err: any) {
      console.error('[useCompose] Error creating direct chat:', err);
      onError(err.message || 'Unable to open the conversation.');
      setIsSubmitting(false);
    }
  }, [router, onError]);

  const handleCreateGroup = useCallback(async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      onError('Group name must be at least 2 characters.');
      return;
    }
    if (selectedContacts.length === 0) {
      onError('At least one group member is required.');
      return;
    }

    setIsSubmitting(true);
    onError(null);

    try {
      const response = await fetchWithAuth('/api/chats/group', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          userIds: selectedContacts.map((c) => c.userId),
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const convoId = response.conversation?.id;
      if (convoId) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        router.replace(`/thread/${convoId}`);
      } else {
        throw new Error('No conversation ID returned.');
      }
    } catch (err: any) {
      console.error('[useCompose] Error creating group chat:', err);
      onError(err.message || 'Unable to create the group.');
      setIsSubmitting(false);
    }
  }, [groupName, selectedContacts, router, onError]);

  return {
    isSubmitting,
    setIsSubmitting,
    handleStartDirectChat,
    handleCreateGroup,
  };
}
