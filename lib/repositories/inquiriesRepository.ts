import {
  ChatInquiryTemplate,
  ChatInquiryTemplateField,
  InquiryResponseItem,
  FormTrigger,
  fetchInquiryResponses,
  fetchInquiryTemplates,
  ensureTemplate,
  updateTemplateMeta,
  createTemplateField,
  updateTemplateField,
  deleteTemplateField,
} from './inquiries';

export * from './inquiries';

/**
 * Domain Inquiries Repository
 * Encapsulates inquiry templates and responses persistence and API synchronization.
 */
export const inquiriesRepository = {
  fetchInquiryResponses,
  fetchInquiryTemplates,
  ensureTemplate,
  updateTemplateMeta,
  createTemplateField,
  updateTemplateField,
  deleteTemplateField,
};
