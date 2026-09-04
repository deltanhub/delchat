/**
 * Utility functions for resolving media and image URLs in the React Native / Expo mobile app.
 *
 * In web browsers, relative URLs such as `/api/listing-preview-image/...` automatically resolve
 * against the window origin (`https://deltanhub.com`). In React Native, native image loaders
 * (iOS NSURLSession / Android OkHttp) fail unless an absolute URL with a scheme is provided.
 */

export const FALLBACK_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
export const FALLBACK_AVATAR_IMAGE =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

const BASE_URL = (process.env.EXPO_PUBLIC_SITE_URL || 'https://deltanhub.com').replace(/\/$/, '');

/**
 * Resolves any image URL, relative API path, or storage path into an absolute HTTPS URL.
 */
export function resolveMediaUrl(
  url?: string | null,
  fallback: string | null = null
): string | null {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  // If it's already an absolute URL (http or https)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // If it's a data URI or local file URI
  if (/^(data|file|blob):/i.test(trimmed)) {
    return trimmed;
  }

  // If it's a relative path starting with /
  if (trimmed.startsWith('/')) {
    return `${BASE_URL}${trimmed}`;
  }

  // If it's a relative path without leading slash
  if (trimmed.startsWith('api/') || trimmed.startsWith('uploads/') || trimmed.startsWith('assets/')) {
    return `${BASE_URL}/${trimmed}`;
  }

  return trimmed;
}

/**
 * Helper specifically for property listing cover images and gallery images.
 */
export function resolveListingImageUrl(
  url?: string | null,
  fallback = FALLBACK_PROPERTY_IMAGE
): string {
  return resolveMediaUrl(url, fallback) || fallback;
}

/**
 * Helper specifically for user avatars.
 */
export function resolveAvatarUrl(
  url?: string | null,
  fallback?: string | null
): string | null {
  return resolveMediaUrl(url, fallback || null);
}

/**
 * Resilient cross-platform upload utility for voice notes, camera captures, and documents.
 * On React Native (iOS & Android), naive fetch(file://).blob() can fail or return empty buffers.
 * This utility uses a dual-strategy (FormData with native file URI, falling back to fetch blob).
 */
export async function uploadLocalFileToSupabaseStorage(
  supabaseClient: any,
  bucket: string,
  fileName: string,
  localUri: string,
  mimeType: string
): Promise<{ signedUrl: string | null; error: Error | null }> {
  try {
    // Strategy 1: Standard React Native FormData upload
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as any);

    const { error: formErr } = await supabaseClient.storage
      .from(bucket)
      .upload(fileName, formData, { contentType: mimeType, upsert: true });

    if (formErr) {
      // Strategy 2: Blob fallback
      const resp = await fetch(localUri);
      const blob = await resp.blob();
      const { error: blobErr } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: mimeType, upsert: true });
      if (blobErr) throw blobErr;
    }

    const { data: signed } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(fileName, 86400 * 365);

    return { signedUrl: signed?.signedUrl || null, error: null };
  } catch (err: any) {
    console.warn('[Storage] Upload error:', err);
    return { signedUrl: null, error: err };
  }
}
