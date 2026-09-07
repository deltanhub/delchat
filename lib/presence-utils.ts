/**
 * Presence and Last Seen Formatting Utilities
 * Synchronized with DeltanHub Web formatWhatsAppLastSeen implementation.
 */

export function formatWhatsAppLastSeen(
  lastSeenIso: string | null | undefined,
  isOnline: boolean,
  isTyping: boolean,
  fallbackSubtitle?: string
): string {
  if (isTyping) return 'typing...';
  if (isOnline) return 'online';
  if (!lastSeenIso) return fallbackSubtitle || 'offline';

  try {
    const d = new Date(lastSeenIso);
    if (isNaN(d.getTime())) return fallbackSubtitle || 'offline';

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `last seen today at ${timeStr}`;
    if (isYesterday) return `last seen yesterday at ${timeStr}`;

    const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `last seen ${dateStr} at ${timeStr}`;
  } catch {
    return fallbackSubtitle || 'offline';
  }
}
