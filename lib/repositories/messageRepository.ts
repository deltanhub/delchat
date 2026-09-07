import { supabase } from '../supabase';
import { ChatMessage, ChatAttachmentItem } from '../../components/chat/bubbles/types';

interface DbMessageRow {
  id: string;
  conversation_id: string;
  sender_type?: 'user' | 'assistant' | 'system' | 'admin';
  sender_user_id: string | null;
  sender_assistant_key?: string | null;
  message_kind?: ChatMessage['messageKind'];
  body?: string | null;
  intent?: string | null;
  structured_payload?: Record<string, any> | null;
  reactions?: Record<string, string[]> | null;
  created_at: string;
  message_status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  delivered_at?: string | null;
  read_at?: string | null;
}

export interface FetchMessagesParams {
  conversationId: string;
  currentUserId: string;
  limit?: number;
  beforeTimestamp?: string | null;
  partnerLastReadTime?: number | null;
}

export interface FetchMessagesResult {
  messages: ChatMessage[];
  hasMore: boolean;
  starredMsgIds: Set<string>;
}

export interface SendTextMessageParams {
  conversationId: string;
  senderUserId: string;
  body: string;
  intent?: string;
  replySnapshot?: {
    id: string;
    authorName?: string;
    body?: string;
  } | null;
}

export interface SendVoiceNoteMessageParams {
  conversationId: string;
  senderUserId: string;
  durationSeconds: number;
  audioUrl: string;
  localUri: string;
  fileName: string;
}

export interface SendDocumentMessageParams {
  conversationId: string;
  senderUserId: string;
  docName: string;
  docSize: number;
  mimeType: string;
  signedUrl: string;
  fileName: string;
}

export interface SendListingMessageParams {
  conversationId: string;
  senderUserId: string;
  listing: {
    id: string;
    title: string;
    price?: string;
    location?: string;
    imageUrl?: string;
    referenceCode?: string;
    listingStatus?: string;
  };
}

export interface SendEmbedMessageParams {
  conversationId: string;
  senderUserId: string;
  embedUrl: string;
  title?: string;
}

export interface SendInquiryTemplateParams {
  conversationId: string;
  senderUserId: string;
  templateId: string;
  templateTitle: string;
  fields: Array<{
    id: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
    isRequired: boolean;
    options?: string[];
  }>;
}

export interface SendInquiryResponseParams {
  conversationId: string;
  senderUserId: string;
  answers: Record<string, any>;
}

/**
 * MessageRepository encapsulates all message persistence, queries, attachments,
 * reactions, and key-set cursor pagination for thread chats.
 */
export const messageRepository = {
  /**
   * Fetches a paginated slice of messages for a conversation, excluding internal notes.
   */
  async fetchThreadMessages(params: FetchMessagesParams): Promise<FetchMessagesResult> {
    const {
      conversationId,
      currentUserId,
      limit = 30,
      beforeTimestamp,
      partnerLastReadTime,
    } = params;

    let query = supabase
      .from('chat_messages')
      .select(`
        id, conversation_id, sender_type, sender_user_id, sender_assistant_key,
        message_kind, body, intent, structured_payload, reactions, created_at,
        message_status, delivered_at, read_at
      `)
      .eq('conversation_id', conversationId)
      .neq('intent', 'internal_note')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    const { data: rawMsgRows, error: msgError } = await query;
    if (msgError) throw msgError;

    const msgRows = (rawMsgRows as DbMessageRow[]) || [];
    const hasMore = msgRows.length >= limit;
    const msgIds = msgRows.map((m) => m.id);

    // 1. Load starred messages for this user
    const starredMsgIds = new Set<string>();
    if (msgIds.length > 0) {
      try {
        const { data: starredRows } = await supabase
          .from('chat_starred_messages')
          .select('message_id')
          .eq('user_id', currentUserId)
          .in('message_id', msgIds);

        starredRows?.forEach((s: any) => starredMsgIds.add(s.message_id));
      } catch (err) {
        console.warn('[messageRepository] Error loading starred messages:', err);
      }
    }

    // 2. Load signed attachments from chat_message_attachments
    const attachmentsByMessage: Record<string, ChatAttachmentItem[]> = {};
    if (msgIds.length > 0) {
      try {
        const { data: attRows } = await supabase
          .from('chat_message_attachments')
          .select('*')
          .in('message_id', msgIds);

        if (attRows && attRows.length > 0) {
          await Promise.all(
            attRows.map(async (att: any) => {
              if (!attachmentsByMessage[att.message_id]) {
                attachmentsByMessage[att.message_id] = [];
              }
              let finalUrl = '';
              const bucket = att.storage_bucket || 'chat-attachments';
              try {
                const { data: signedData } = await supabase.storage
                  .from(bucket)
                  .createSignedUrl(att.storage_path, 86400);
                finalUrl = signedData?.signedUrl || '';
              } catch {
                finalUrl = att.storage_path;
              }

              attachmentsByMessage[att.message_id].push({
                id: att.id,
                url: finalUrl,
                originalName: att.original_name || att.original_file_name || 'Attachment',
                mimeType: att.mime_type || 'application/octet-stream',
                sizeBytes: att.size_bytes || att.file_size_bytes || 0,
                kind:
                  (att.attachment_kind as ChatAttachmentItem['kind']) ||
                  (att.mime_type?.startsWith('image/')
                    ? 'image'
                    : att.mime_type?.startsWith('video/')
                    ? 'video'
                    : att.mime_type?.startsWith('audio/')
                    ? 'audio'
                    : 'document'),
              });
            })
          );
        }
      } catch (err) {
        console.warn('[messageRepository] Error loading attachments:', err);
      }
    }

    // 3. Resolve public user profiles for sender names
    const senderIds = Array.from(
      new Set(msgRows.map((m) => m.sender_user_id).filter((id): id is string => Boolean(id)))
    );
    const profilesMap = new Map<string, string>();
    if (senderIds.length > 0) {
      try {
        const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
          requested_user_ids: senderIds,
        });
        profiles?.forEach((p: any) => {
          profilesMap.set(p.user_id, p.display_name?.trim() || p.full_name?.trim() || 'User');
        });
      } catch (err) {
        console.warn('[messageRepository] Error fetching profiles:', err);
      }
    }

    // 4. Map raw DB rows into ChatMessage domain models
    const messages: ChatMessage[] = msgRows.map((msg: any) => {
      const senderName = msg.sender_user_id ? profilesMap.get(msg.sender_user_id) : null;
      const rawPayload = msg.structured_payload || {};
      let computedStatus: 'sending' | 'sent' | 'delivered' | 'read' = 'sent';
      const msgTime = new Date(msg.created_at).getTime();

      if (
        msg.read_at ||
        (partnerLastReadTime && partnerLastReadTime >= msgTime) ||
        msg.message_status === 'read'
      ) {
        computedStatus = 'read';
      } else if (msg.delivered_at || msg.message_status === 'delivered') {
        computedStatus = 'delivered';
      } else {
        computedStatus = 'sent';
      }

      return {
        id: msg.id,
        senderType: msg.sender_type || 'user',
        senderUserId: msg.sender_user_id,
        authorName: msg.sender_user_id === currentUserId ? 'You' : senderName || 'Partner',
        authorRoleLabel: msg.sender_user_id === currentUserId ? 'You' : 'Seller',
        status: computedStatus,
        messageKind: msg.message_kind || 'text',
        body: msg.body || '',
        sentAt: msg.created_at,
        readAt: msg.read_at,
        deliveredAt: msg.delivered_at,
        intent: msg.intent,
        attachments: attachmentsByMessage[msg.id] || [],
        listingCard: rawPayload.listingCard || null,
        inquiryFormCard:
          rawPayload.inquiryFormCard || (msg.message_kind === 'inquiry_form' ? rawPayload : null),
        inquiryResponseCard:
          rawPayload.inquiryResponseCard ||
          (msg.message_kind === 'inquiry_response' ? rawPayload : null),
        reactions: msg.reactions || rawPayload.reactions || {},
        structuredPayload: rawPayload,
      };
    });

    return { messages, hasMore, starredMsgIds };
  },

  /**
   * Toggles star state of a message via atomic RPC.
   */
  async toggleMessageStar(messageId: string): Promise<void> {
    const { error } = await supabase.rpc('toggle_chat_message_star', {
      p_message_id: messageId,
    });
    if (error) throw error;
  },

  /**
   * Toggles emoji reaction on a message via atomic RPC.
   */
  async toggleMessageReaction(messageId: string, emoji: string): Promise<Record<string, string[]>> {
    const { data: updatedReactions, error } = await supabase.rpc('toggle_chat_message_reaction', {
      p_message_id: messageId,
      p_emoji: emoji,
    });
    if (error) throw error;
    return updatedReactions;
  },

  /**
   * Deletes a message by ID.
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
    if (error) throw error;
  },

  /**
   * Marks conversation read atomically via RPC.
   */
  async markConversationRead(conversationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_chat_conversation_read_atomic', {
      p_conversation_id: conversationId,
    });
    if (error) throw error;
  },

  /**
   * Inserts a text message.
   */
  async sendTextMessage(params: SendTextMessageParams): Promise<{ id: string; createdAt: string }> {
    const { conversationId, senderUserId, body, intent = 'general', replySnapshot } = params;
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'user',
        sender_user_id: senderUserId,
        message_kind: 'text',
        body,
        intent,
        structured_payload: replySnapshot
          ? {
              replyTo: {
                messageId: replySnapshot.id,
                authorName: replySnapshot.authorName,
                body: replySnapshot.body,
              },
            }
          : {},
      })
      .select('id, created_at')
      .single();

    if (error) throw error;
    return { id: data.id, createdAt: data.created_at };
  },

  /**
   * Inserts a voice note message and its attachment record.
   */
  async sendVoiceNoteMessage(
    params: SendVoiceNoteMessageParams
  ): Promise<{ id: string; createdAt: string }> {
    const { conversationId, senderUserId, durationSeconds, audioUrl, localUri, fileName } = params;
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'user',
        sender_user_id: senderUserId,
        message_kind: 'voice_note',
        body: 'Voice note',
        intent: 'general',
        structured_payload: {
          voiceNote: {
            durationSeconds,
            audioUrl,
            localUri,
          },
        },
      })
      .select('id, created_at')
      .single();

    if (error) throw error;

    try {
      await supabase.from('chat_message_attachments').insert({
        message_id: data.id,
        attachment_kind: 'audio',
        storage_bucket: 'chat-attachments',
        storage_path: fileName,
        original_name: fileName,
        safe_name: fileName,
        mime_type: 'audio/m4a',
        size_bytes: 0,
        scan_status: 'passed',
      });
    } catch (attErr) {
      console.warn('[messageRepository] Voice note attachment insert warning:', attErr);
    }

    return { id: data.id, createdAt: data.created_at };
  },

  /**
   * Inserts a document message and its attachment record.
   */
  async sendDocumentMessage(
    params: SendDocumentMessageParams
  ): Promise<{ id: string; createdAt: string }> {
    const { conversationId, senderUserId, docName, docSize, mimeType, signedUrl, fileName } = params;
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'user',
        sender_user_id: senderUserId,
        message_kind: 'attachments',
        body: docName || 'Document Attached',
        intent: 'general',
        structured_payload: {
          document: {
            name: docName,
            size: docSize,
            mimeType,
            url: signedUrl,
          },
          attachments: [
            {
              url: signedUrl,
              kind: 'document',
              originalName: docName,
              sizeBytes: docSize,
              mimeType,
            },
          ],
        },
      })
      .select('id, created_at')
      .single();

    if (error) throw error;

    try {
      await supabase.from('chat_message_attachments').insert({
        message_id: data.id,
        attachment_kind: 'document',
        storage_bucket: 'chat-attachments',
        storage_path: fileName,
        original_name: docName || fileName,
        safe_name: fileName,
        mime_type: mimeType,
        size_bytes: docSize,
        scan_status: 'passed',
      });
    } catch (attErr) {
      console.warn('[messageRepository] Document attachment insert warning:', attErr);
    }

    return { id: data.id, createdAt: data.created_at };
  },

  /**
   * Inserts a property listing card message.
   */
  async sendListingMessage(
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
  },

  /**
   * Inserts an interactive embed message.
   */
  async sendEmbedMessage(
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
        structured_payload: {
          embed: {
            title: displayTitle,
            url: embedUrl,
          },
        },
      })
      .select('id, created_at')
      .single();

    if (error) throw error;
    return { id: data.id, createdAt: data.created_at };
  },

  /**
   * Inserts an inquiry questionnaire template.
   */
  async sendInquiryTemplate(
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
        structured_payload: {
          inquiryFormCard: {
            templateId,
            templateTitle,
            fields,
          },
        },
      })
      .select('id, created_at')
      .single();

    if (error) throw error;
    return { id: data.id, createdAt: data.created_at };
  },

  /**
   * Inserts an inquiry response submission.
   */
  async sendInquiryResponse(
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
            answers: Object.entries(answers).map(([label, val]) => ({
              label,
              value: String(val),
            })),
          },
        },
      })
      .select('id, created_at')
      .single();

    if (error) throw error;
    return { id: data.id, createdAt: data.created_at };
  },
};
