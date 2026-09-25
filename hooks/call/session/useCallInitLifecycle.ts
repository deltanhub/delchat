import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { resolveAvatarUrl } from '../../../lib/media-utils';
import { callRepository } from '../../../lib/repositories';
import { callKit } from '../../../lib/voip/callkit';
import { callRingtoneService } from '../../../lib/voip/callRingtoneService';
import { resolveCallPartner } from './callPartnerResolver';
import { UseCallInitLifecycleParams } from './types';

export function useCallInitLifecycle(params: UseCallInitLifecycleParams) {
  const router = useRouter();
  const {
    conversationId,
    kind,
    role,
    activeSessionId,
    setCurrentUser,
    setPartnerUserId,
    setPartnerName,
    setPartnerAvatarUrl,
    setPartnerRole,
    setCallPhase,
    setActiveSessionId,
    setCallDuration,
    durationTimerRef,
    ringTimeoutRef,
    audioGov,
    media,
    signaling,
    handleEndCall,
  } = params;

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/auth');
          return;
        }
        if (isMounted) setCurrentUser(user);

        const partner = await resolveCallPartner(conversationId, user.id);
        if (partner && isMounted) {
          setPartnerUserId(partner.userId);
          setPartnerName(partner.name);
          setPartnerAvatarUrl(partner.avatarUrl);
          setPartnerRole(partner.role);
        }

        await media.initMedia(kind);

        if (role === 'initiator') {
          setCallPhase('outgoing');
          callRingtoneService.playOutgoingRingback();

          const result = await callRepository.createCallSession({
            conversationId,
            initiatorUserId: user.id,
            callMode: kind,
          });

          if (result && isMounted) {
            setActiveSessionId(result.sessionId);
            void callKit.startOutgoingCall({
              callUuid: result.sessionId,
              handle: conversationId,
              contactName: 'DeltanHub Member',
              isVideo: kind === 'video',
            });

            if (result.invitedUserIds.length > 0) {
              callRepository.broadcastIncomingCallNotification(result.invitedUserIds, {
                callId: result.sessionId,
                conversationId,
                callMode: kind,
                callerUserId: user.id,
                callerName: user.user_metadata?.full_name || 'DeltanHub Member',
                callerAvatarUrl: resolveAvatarUrl(user.user_metadata?.avatar_url),
              });
            }
          }

          ringTimeoutRef.current = setTimeout(() => {
            if (isMounted) handleEndCall();
          }, 35000);
        } else {
          if (!activeSessionId) {
            const activeSession = await callRepository.fetchActiveCallSession(conversationId);
            if (activeSession && isMounted) setActiveSessionId(activeSession.id);
          }
          callRingtoneService.stopAllRingtones();
          setCallPhase('connected');
          audioGov.setupAudioForConnectedCall(kind);
          if (!durationTimerRef.current) {
            durationTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
          }
          signaling.sendSignal('receiver-ready', {});
        }
      } catch (err: any) {
        callRingtoneService.stopAllRingtones();
        Alert.alert('Call Setup Error', err?.message || 'Unable to initialize call');
        router.back();
      }
    }

    void init();

    return () => {
      isMounted = false;
      callRingtoneService.stopAllRingtones();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      audioGov.cleanupAudio();
      media.cleanupMedia();
    };
  }, [conversationId, role, kind]);
}
