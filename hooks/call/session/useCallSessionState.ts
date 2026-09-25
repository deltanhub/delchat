import { useState, useRef } from 'react';
import type { CallPhase } from '../../../components/chat/CallModal';
import { UseCallSessionParams } from './types';

export function useCallSessionState({
  kind = 'audio',
  role = 'initiator',
  initialCallId,
  initialPartnerUserId,
  initialPartnerName,
  initialPartnerAvatarUrl,
}: UseCallSessionParams) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [callPhase, setCallPhase] = useState<CallPhase>(
    role === 'receiver' ? 'connected' : 'outgoing'
  );
  const [partnerUserId, setPartnerUserId] = useState<string | null>(initialPartnerUserId || null);
  const [partnerName, setPartnerName] = useState(initialPartnerName || 'DeltanHub Member');
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(initialPartnerAvatarUrl || null);
  const [partnerRole, setPartnerRole] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [activeCallKind, setActiveCallKind] = useState<'audio' | 'video'>(kind || 'audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteIsMuted, setRemoteIsMuted] = useState(false);
  const [remoteIsVideoOff, setRemoteIsVideoOff] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialCallId || null);

  const durationTimerRef = useRef<any>(null);
  const ringTimeoutRef = useRef<any>(null);

  return {
    currentUser,
    setCurrentUser,
    callPhase,
    setCallPhase,
    partnerUserId,
    setPartnerUserId,
    partnerName,
    setPartnerName,
    partnerAvatarUrl,
    setPartnerAvatarUrl,
    partnerRole,
    setPartnerRole,
    callDuration,
    setCallDuration,
    activeCallKind,
    setActiveCallKind,
    isMuted,
    setIsMuted,
    isVideoOff,
    setIsVideoOff,
    remoteIsMuted,
    setRemoteIsMuted,
    remoteIsVideoOff,
    setRemoteIsVideoOff,
    activeSessionId,
    setActiveSessionId,
    durationTimerRef,
    ringTimeoutRef,
  };
}
