import { ChatMessage } from '../types';

export interface InquiryFormBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onSendInquiryResponse?: (answers: Record<string, any>) => void;
}
