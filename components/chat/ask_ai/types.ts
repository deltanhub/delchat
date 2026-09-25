import type { ChatMessage } from '../MessageBubble';

export interface AskAIModalProps {
  visible: boolean;
  message: ChatMessage | null;
  onClose: () => void;
  onInsertToComposer: (text: string) => void;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: 'chatbubble-ellipses-outline' | 'bulb-outline' | 'list-outline' | 'trending-up-outline';
  prompt: string;
}

export interface AskAIHeaderProps {
  isDark: boolean;
  onClose: () => void;
}

export interface AskAIContextCardProps {
  messageBody?: string | null;
  isDark: boolean;
}

export interface AskAIQuickActionsProps {
  actions: QuickAction[];
  isDark: boolean;
  onSelectAction: (prompt: string) => void;
}

export interface AskAIResponseCardProps {
  response: string;
  isDark: boolean;
  onInsert: () => void;
}
