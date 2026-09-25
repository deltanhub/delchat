import { useMemo } from 'react';
import type { UseLeadTimelineAuditParams, UseLeadTimelineAuditReturn } from './types';

export function useLeadTimelineAudit({
  messages,
  agentUserId,
}: UseLeadTimelineAuditParams): UseLeadTimelineAuditReturn {
  const buyerMsgCount = useMemo(
    () => messages.filter((m) => m.senderUserId !== agentUserId).length,
    [messages, agentUserId]
  );

  const agentMsgCount = useMemo(
    () => messages.filter((m) => m.senderUserId === agentUserId).length,
    [messages, agentUserId]
  );

  const firstMsg = messages[messages.length - 1];
  const lastMsg = messages[0];

  const firstContactTime = useMemo(
    () => (firstMsg ? new Date(firstMsg.sentAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'None'),
    [firstMsg]
  );

  const lastContactTime = useMemo(
    () => (lastMsg ? new Date(lastMsg.sentAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'None'),
    [lastMsg]
  );

  const { responseTimeText, firstReplySub } = useMemo(() => {
    const buyerFirstMsg = [...messages].reverse().find((m) => m.senderUserId !== agentUserId);
    const agentFirstReply = buyerFirstMsg
      ? [...messages].reverse().find(
          (m) => m.senderUserId === agentUserId && new Date(m.sentAt).getTime() > new Date(buyerFirstMsg.sentAt).getTime()
        )
      : null;

    if (!buyerFirstMsg || !agentFirstReply) {
      return { responseTimeText: 'Awaiting reply', firstReplySub: 'No agent response yet' };
    }

    const diffMs = new Date(agentFirstReply.sentAt).getTime() - new Date(buyerFirstMsg.sentAt).getTime();
    const diffMin = Math.max(1, Math.round(diffMs / 60000));
    if (diffMin < 60) return { responseTimeText: `~ ${diffMin} min`, firstReplySub: `First reply: ${diffMin} min` };
    if (diffMin < 1440) {
      const hours = Math.round(diffMin / 60);
      return { responseTimeText: `~ ${hours} hr${hours > 1 ? 's' : ''}`, firstReplySub: `First reply: ${hours} hr${hours > 1 ? 's' : ''}` };
    }
    const days = Math.round(diffMin / 1440);
    return { responseTimeText: `~ ${days} day${days > 1 ? 's' : ''}`, firstReplySub: `First reply: ${days} day${days > 1 ? 's' : ''}` };
  }, [messages, agentUserId]);

  return {
    buyerMsgCount,
    agentMsgCount,
    firstMsg,
    lastMsg,
    firstContactTime,
    lastContactTime,
    responseTimeText,
    firstReplySub,
  };
}
