import type { QuickAction } from './types';

export const DELTAN_INTELLIGENCE_ENDPOINT = '/api/deltan-intelligence/chat-mention';

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'reply',
    title: 'Draft Reply',
    icon: 'chatbubble-ellipses-outline',
    prompt: 'Draft a polite, professional, and persuasive real estate response to this message:',
  },
  {
    id: 'explain',
    title: 'Explain Terms',
    icon: 'bulb-outline',
    prompt: 'Explain any real estate terms, legal nuances, or financing conditions mentioned in this message clearly:',
  },
  {
    id: 'summarize',
    title: 'Summarize',
    icon: 'list-outline',
    prompt: 'Summarize the core request, action items, and next steps from this client message:',
  },
  {
    id: 'negotiate',
    title: 'Offer Advice',
    icon: 'trending-up-outline',
    prompt: 'Provide strategic advice for negotiating the price or conditions discussed in this message:',
  },
];
