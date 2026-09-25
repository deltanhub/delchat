import { FlatList } from 'react-native';

export function jumpToThreadMessage(
  msgId: string,
  convId: string | undefined,
  currentConversationId: string,
  messages: any[],
  flatListRef: React.RefObject<FlatList | null>,
  router: { push: (href: any) => void }
) {
  if (convId && convId !== currentConversationId) {
    router.push(`/thread/${convId}`);
  } else {
    const targetIndex = messages.findIndex((m: any) => m.id === msgId);
    if (targetIndex >= 0 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated: true,
        });
      } catch {
        // If message is beyond rendered window
      }
    }
  }
}
