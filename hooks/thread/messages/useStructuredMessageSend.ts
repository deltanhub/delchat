import { useCallback } from 'react';
import { Alert } from 'react-native';
import { messageRepository } from '../../../lib/repositories/messageRepository';
import { broadcastInboxAlert } from '../../../lib/sync-coordinator';
import type { SelectedListing } from '../../../components/chat/PropertyCatalogModal';
import type { SelectedInquiryTemplate } from '../../../components/chat/InquiryFormModal';

export function useStructuredMessageSend(
  conversationId: string,
  currentUser: any,
  partnerUserId: string | null | undefined,
  ensureParticipantAuthorization: () => Promise<boolean>,
  fetchMessages: () => Promise<void>
) {
  const handleSendCatalogListing = useCallback(async (listing: SelectedListing) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendListingMessage({
        conversationId,
        senderUserId: currentUser.id,
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          location: listing.location,
          imageUrl: listing.imageUrl || undefined,
          referenceCode: listing.referenceCode || undefined,
          listingStatus: listing.listingStatus,
        },
      });
      broadcastInboxAlert({ recipientUserId: partnerUserId, conversationId, senderUserId: currentUser.id });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Catalog Error', e.message);
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, fetchMessages]);

  const handleSendInquiryTemplate = useCallback(async (tmpl: SelectedInquiryTemplate) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendInquiryTemplate({
        conversationId,
        senderUserId: currentUser.id,
        templateId: tmpl.templateId,
        templateTitle: tmpl.templateTitle,
        fields: tmpl.fields.map((f, idx) => ({
          id: f.id || f.fieldName || `field_${idx}`,
          fieldName: f.fieldName,
          fieldLabel: f.fieldLabel,
          fieldType: f.fieldType,
          isRequired: Boolean(f.isRequired),
          options: f.options,
        })),
      });
      broadcastInboxAlert({ recipientUserId: partnerUserId, conversationId, senderUserId: currentUser.id });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Inquiry Form Error', e.message);
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, fetchMessages]);

  const handleSendEmbed = useCallback(async (embedUrl: string) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendEmbedMessage({
        conversationId,
        senderUserId: currentUser.id,
        embedUrl,
        title: '3D Virtual Tour',
      });
      broadcastInboxAlert({ recipientUserId: partnerUserId, conversationId, senderUserId: currentUser.id });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Embed Error', e.message);
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, fetchMessages]);

  const handleSendInquiryResponse = useCallback(async (answers: Record<string, any>) => {
    if (!conversationId || !currentUser) return;
    try {
      if (!(await ensureParticipantAuthorization())) return;
      await messageRepository.sendInquiryResponse({ conversationId, senderUserId: currentUser.id, answers });
      broadcastInboxAlert({ recipientUserId: partnerUserId, conversationId, senderUserId: currentUser.id });
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Inquiry Response Error', e.message);
    }
  }, [conversationId, currentUser, partnerUserId, ensureParticipantAuthorization, fetchMessages]);

  return {
    handleSendCatalogListing,
    handleSendInquiryTemplate,
    handleSendEmbed,
    handleSendInquiryResponse,
  };
}
