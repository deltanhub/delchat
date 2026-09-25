import { useMemo } from 'react';
import { ChatMessage, ChatAttachmentItem } from '../types';

export function extractMediaItems(message: ChatMessage): ChatAttachmentItem[] {
  const items: ChatAttachmentItem[] = [
    ...(message.attachments ? message.attachments.filter((a) => a.kind === 'image' || a.kind === 'video') : []),
    ...(Array.isArray(message.structuredPayload?.attachments)
      ? message.structuredPayload.attachments
          .filter((a: any) => a && (a.kind === 'image' || a.kind === 'video' || (!a.kind && a.url)))
          .map((a: any, idx: number) => ({
            id: a.id || `${message.id}-media-${idx}`,
            url: a.url,
            originalName: a.originalName || a.original_name || 'Media',
            mimeType: a.mimeType || (a.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
            sizeBytes: a.sizeBytes || a.size_bytes || 0,
            kind: (a.kind === 'video' ? 'video' : 'image') as 'video' | 'image',
          }))
      : []),
  ];
  return items.filter((item, index, self) =>
    index === self.findIndex((m) => (m.url && m.url === item.url) || m.id === item.id)
  );
}

export function extractDocumentItems(message: ChatMessage): ChatAttachmentItem[] {
  const items: ChatAttachmentItem[] = [
    ...(message.attachments ? message.attachments.filter((a) => a.kind === 'document') : []),
    ...(message.structuredPayload?.document
      ? [{
          id: `${message.id}-doc`,
          url: message.structuredPayload.document.url,
          originalName: message.structuredPayload.document.name || 'Document',
          mimeType: message.structuredPayload.document.mimeType || 'application/pdf',
          sizeBytes: message.structuredPayload.document.size || 0,
          kind: 'document' as const,
        }]
      : []),
  ];
  return items.filter((doc, index, self) =>
    index === self.findIndex((d) => (d.url && d.url === doc.url) || d.originalName === doc.originalName)
  );
}

export function useTextMessageAttachments(message: ChatMessage) {
  const mediaItems = useMemo(() => extractMediaItems(message), [message]);
  const documentItems = useMemo(() => extractDocumentItems(message), [message]);

  return { mediaItems, documentItems };
}

export default useTextMessageAttachments;
