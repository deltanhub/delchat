import { supabase } from '../../supabase';
import {
  SendListingMessageParams,
  SendEmbedMessageParams,
  SendInquiryTemplateParams,
  SendInquiryResponseParams,
} from './types';

export async function sendListingMessage(
  params: SendListingMessageParams
): Promise<{ id: string; createdAt: string }> {
  const { conversationId, senderUserId, listing } = params;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_user_id: senderUserId,
      message_kind: 'listing_card',
      body: `Property Shared: ${listing.title}`,
      intent: 'general',
      structured_payload: {
        listingCard: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          location: listing.location,
          imageUrl: listing.imageUrl,
          referenceCode: listing.referenceCode,
          status: listing.listingStatus,
        },
      },
    })
    .select('id, created_at')
    .single();

  if (error) throw error;
  return { id: data.id, createdAt: data.created_at };
}

export async function sendEmbedMessage(
  params: SendEmbedMessageParams
): Promise<{ id: string; createdAt: string }> {
  const { conversationId, senderUserId, embedUrl, title } = params;
  const displayTitle = title || '3D Virtual Tour Embed';
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_user_id: senderUserId,
      message_kind: 'embed',
      body: displayTitle,
      intent: 'tour',
      structured_payload: { embed: { title: displayTitle, url: embedUrl } },
    })
    .select('id, created_at')
    .single();

  if (error) throw error;
  return { id: data.id, createdAt: data.created_at };
}

export async function sendInquiryTemplate(
  params: SendInquiryTemplateParams
): Promise<{ id: string; createdAt: string }> {
  const { conversationId, senderUserId, templateId, templateTitle, fields } = params;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_user_id: senderUserId,
      message_kind: 'inquiry_form',
      body: `Inquiry Questionnaire: ${templateTitle}`,
      intent: 'general',
      structured_payload: { inquiryFormCard: { templateId, templateTitle, fields } },
    })
    .select('id, created_at')
    .single();

  if (error) throw error;
  return { id: data.id, createdAt: data.created_at };
}

export async function sendInquiryResponse(
  params: SendInquiryResponseParams
): Promise<{ id: string; createdAt: string }> {
  const { conversationId, senderUserId, answers } = params;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_user_id: senderUserId,
      message_kind: 'inquiry_response',
      body: 'Inquiry questionnaire answers submitted',
      intent: 'general',
      structured_payload: {
        inquiryResponseCard: {
          templateTitle: 'Inquiry Questionnaire',
          answers: Object.entries(answers).map(([label, val]) => ({ label, value: String(val) })),
        },
      },
    })
    .select('id, created_at')
    .single();

  if (error) throw error;
  return { id: data.id, createdAt: data.created_at };
}
