import type { FormTrigger } from '../../../types/inquiries';

export const DEFAULT_TEMPLATES: Record<FormTrigger, { title: string; description: string }> = {
  tour: {
    title: 'Tour Request Form',
    description: 'Please share your preferences so we can schedule your viewing.',
  },
  question: {
    title: 'General Inquiry Form',
    description: 'Let us know your requirements before we start chatting.',
  },
};
