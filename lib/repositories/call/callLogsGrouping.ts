import { ChatCallLog, GroupedChatCallLog } from './types';

/**
 * Group consecutive call logs by peer, mode, direction, and date.
 * Matches DeltanHub web chats-workspace.tsx lines 2968-3007.
 */
export function groupCallLogs(callLogs: ChatCallLog[], query: string = ''): GroupedChatCallLog[] {
  const q = query.trim().toLowerCase();
  const grouped: GroupedChatCallLog[] = [];
  let currentGroup: GroupedChatCallLog | null = null;

  for (const log of callLogs) {
    if (q) {
      const matchesName =
        (log.peer.displayName || '').toLowerCase().includes(q) ||
        (log.peer.fullName || '').toLowerCase().includes(q) ||
        (log.peer.username || '').toLowerCase().includes(q) ||
        (log.peer.phone || '').toLowerCase().includes(q);
      if (!matchesName) continue;
    }

    const logDateStr = new Date(log.startedAt).toDateString();
    const prevDateStr = currentGroup ? new Date(currentGroup.startedAt).toDateString() : '';

    if (
      currentGroup &&
      currentGroup.peer.userId === log.peer.userId &&
      currentGroup.direction === log.direction &&
      currentGroup.callMode === log.callMode &&
      logDateStr === prevDateStr
    ) {
      currentGroup.count += 1;
    } else {
      if (currentGroup) {
        grouped.push(currentGroup);
      }
      currentGroup = { ...log, count: 1 };
    }
  }

  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
}

/**
 * Format call timestamp relative to today.
 * Matches DeltanHub web chats-workspace.tsx lines 3009-3034.
 */
export function formatCallTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();

    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = dNow.getTime() - dDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    return '';
  }
}
