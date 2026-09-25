import { supabase } from '../../supabase';
import {
  SendTextMessageParams,
  SendVoiceNoteMessageParams,
  SendDocumentMessageParams,
} from './types';

export async function sendTextMessage(params: SendTextMessageParams): Promise<{ id: string; createdAt: string }> {
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
}

export async function sendVoiceNoteMessage(
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
        voiceNote: { durationSeconds, audioUrl, localUri },
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
}

export async function sendDocumentMessage(
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
        document: { name: docName, size: docSize, mimeType, url: signedUrl },
        attachments: [{ url: signedUrl, kind: 'document', originalName: docName, sizeBytes: docSize, mimeType }],
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
}
