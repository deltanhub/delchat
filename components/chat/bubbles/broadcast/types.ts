import { ChatMessage } from '../types';

export interface BroadcastMediaItem {
  kind: 'image' | 'video' | 'tour';
  url: string;
  title?: string;
}

export interface BroadcastPayload {
  title?: string;
  body?: string;
  media?: BroadcastMediaItem[];
  cta_label?: string;
  cta_url?: string;
}

export interface BroadcastBubbleProps {
  message: ChatMessage;
  onPressMedia?: (url: string, kind: string, title?: string) => void;
}
