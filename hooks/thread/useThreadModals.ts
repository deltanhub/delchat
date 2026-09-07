import { useState, useCallback } from 'react';
import type { ChatMessage } from '../../components/chat/MessageBubble';

export type ThreadModalType =
  | 'none'
  | 'action'
  | 'chatInfo'
  | 'chat_info'
  | 'catalog'
  | 'inquiryForm'
  | 'inquiry_form'
  | 'embed'
  | 'report'
  | 'askAI'
  | 'ask_ai'
  | 'starred'
  | 'assignment'
  | 'internalNotes'
  | 'internal_notes'
  | 'leadStatus'
  | 'lead_status'
  | 'leadCapture'
  | 'lead_capture';

export interface OpenModalOptions {
  actionMessage?: ChatMessage | null;
  askAIMessage?: ChatMessage | null;
}

export function useThreadModals() {
  const [activeModal, setActiveModal] = useState<ThreadModalType>('none');
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [askAIMessage, setAskAIMessage] = useState<ChatMessage | null>(null);

  const openModal = useCallback((type: ThreadModalType, options?: OpenModalOptions) => {
    if (options?.actionMessage !== undefined) {
      setActionMessage(options.actionMessage);
    }
    if (options?.askAIMessage !== undefined) {
      setAskAIMessage(options.askAIMessage);
    }
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal('none');
  }, []);

  const openActionModal = useCallback((message: ChatMessage) => {
    setActionMessage(message);
    setActiveModal('action');
  }, []);

  const openAskAIModal = useCallback((message: ChatMessage | null = null) => {
    setAskAIMessage(message);
    setActiveModal('askAI');
  }, []);

  return {
    activeModal,
    actionMessage,
    askAIMessage,
    isActionVisible: activeModal === 'action',
    isChatInfoVisible: activeModal === 'chatInfo' || activeModal === 'chat_info',
    isCatalogVisible: activeModal === 'catalog',
    isInquiryFormVisible: activeModal === 'inquiryForm' || activeModal === 'inquiry_form',
    isEmbedVisible: activeModal === 'embed',
    isReportVisible: activeModal === 'report',
    isAskAIVisible: activeModal === 'askAI' || activeModal === 'ask_ai',
    isStarredVisible: activeModal === 'starred',
    isAssignmentVisible: activeModal === 'assignment',
    isInternalNotesVisible: activeModal === 'internalNotes' || activeModal === 'internal_notes',
    isLeadStatusVisible: activeModal === 'leadStatus' || activeModal === 'lead_status',
    isLeadCaptureVisible: activeModal === 'leadCapture' || activeModal === 'lead_capture',
    isModalOpen: (type: ThreadModalType) => activeModal === type,
    openModal,
    closeModal,
    openActionModal,
    openAskAIModal,
    setActionMessage,
    setAskAIMessage,
  };
}
