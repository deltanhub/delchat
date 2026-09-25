import { ChatMessage } from '../types';

export type ListingData = NonNullable<ChatMessage['listingCard']>;

export interface ListingCardBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isStarred?: boolean;
}
