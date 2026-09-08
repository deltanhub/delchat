import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from '../lib/haptics';
import { resolveAvatarUrl } from '../lib/media-utils';
import {
  fetchIceConfig,
  sendLiveCallSignal,
  updateServerCallSession,
  ChatCallSignal,
} from '../lib/webrtc-signaling';
import {
  configureAudioForCall,
  setSpeakerphone,
  setAudioRoute,
  resetAudioAfterCall,
  AudioRoute,
} from '../lib/webrtc-audio';
import { callRepository } from '../lib/repositories';
import { callKit } from '../lib/voip/callkit';
import { connectionService } from '../lib/voip/connectionService';
import { proximityService } from '../lib/voip/proximityService';
import { callRingtoneService } from '../lib/voip/callRingtoneService';
import { dispatchVoipCallCancellation } from '../lib/services/voipPushService';
import { WebRTCMediaEngine } from '../lib/webrtc/mediaEngine';
import type { CallPhase } from '../components/chat/CallModal';

export interface UseCallSessionParams {
  conversationId: string;
  kind?: 'audio' | 'video';
  role?: 'initiator' | 'receiver';
  initialCallId?: string;
}

export function useCallSession({
  conversationId,
  kind = 'audio',
  role = 'initiator',
  initialCallId,
}: UseCallSessionParams) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [callPhase, setCallPhase] = useState<CallPhase>(
    role === 'receiver' ? 'connected' : 'outgoing'
  );
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('DeltanHub Member');
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);
  const [partnerRole, setPartnerRole] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [activeCallKind, setActiveCallKind] = useState<'audio' | 'video'>(kind || 'audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteIsMuted, setRemoteIsMuted] = useState(false);
  const [remoteIsVideoOff, setRemoteIsVideoOff] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialCallId || null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [connectionHealth, setConnectionHealth] = useState<'connected' | 'reconnecting' | 'failed'>('connected');
  const [audioRoute, setAudioRouteState] = useState<AudioRoute>('earpiece');

  const durationTimerRef = useRef<any>(null);
  const ringTimeoutRef = useRef<any>(null);
  const liveChannelRef = useRef<any>(null);
  const mediaEngineRef = useRef<WebRTCMediaEngine | null>(null);
  const iceConfigRef = useRef<any>(null);

  // 1. Fetch ICE configuration (STUN / TURN)
  useEffect(() => {
    fetchIceConfig()
      .then((config) => {
        iceConfigRef.current = config;
        console.log('[WebRTC ICE Config]', config?.relayConfigured ? 'TURN active' : 'STUN active');
      })
      .catch(() => {});
  }, []);

  // 2. Initialize Call Lifecycle & Hardware Audio
  useEffect(() => {
    let isMounted = true;

    async function initCall() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/auth');
          return;
        }
        if (isMounted) setCurrentUser(user);

        // Fetch partner details
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id, participant_role')
          .eq('conversation_id', conversationId);

        const partner = (participants || []).find((p: any) => p.user_id !== user.id);
        if (partner?.user_id && isMounted) {
          setPartnerUserId(partner.user_id);
          const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
            requested_user_ids: [partner.user_id],
          });
          if (profiles && profiles[0] && isMounted) {
            setPartnerName(
              profiles[0].display_name?.trim() || profiles[0].full_name?.trim() || 'Partner'
            );
            setPartnerAvatarUrl(resolveAvatarUrl(profiles[0].avatar_url));
            setPartnerRole(partner.participant_role || 'Member');
          }
        }

        // Initialize WebRTC Media Engine
        const iceConfig = iceConfigRef.current || (await fetchIceConfig());
        const engine = new WebRTCMediaEngine({
          iceServers: iceConfig.iceServers,
          onLocalIceCandidate: (candidate) => {
            if (activeSessionId && currentUser && partnerUserId) {
              sendLiveCallSignal(liveChannelRef.current, {
                callId: activeSessionId,
                conversationId,
                senderUserId: currentUser.id,
                recipientUserId: partnerUserId,
                signalType: 'ice-candidate',
                payload: candidate,
              });
            }
          },
          onRemoteStream: (stream) => {
            if (isMounted) setRemoteStream(stream);
          },
          onConnectionStateChange: (state) => {
            if (state === 'connected') {
              setConnectionHealth('connected');
            } else if (state === 'disconnected') {
              setConnectionHealth('reconnecting');
            } else if (state === 'failed') {
              setConnectionHealth('failed');
            }
          },
          onIceRestartNeeded: (offer) => {
            if (activeSessionId && currentUser && partnerUserId) {
              console.log('[useCallSession] Broadcasting ICE restart renegotiation offer...');
              sendLiveCallSignal(liveChannelRef.current, {
                callId: activeSessionId,
                conversationId,
                senderUserId: currentUser.id,
                recipientUserId: partnerUserId,
                signalType: 'offer',
                payload: { sdp: offer.sdp, isIceRestart: true },
              });
            }
          },
        });
        mediaEngineRef.current = engine;

        // Acquire local audio and camera media stream
        const acquiredLocalStream = await engine.acquireLocalMedia({
          audio: true,
          video: kind === 'video',
        });
        if (isMounted) setLocalStream(acquiredLocalStream);

        if (role === 'initiator') {
          setCallPhase('outgoing');
          void callRingtoneService.playOutgoingRingback();

          // Delegate session creation to callRepository
          const result = await callRepository.createCallSession({
            conversationId,
            initiatorUserId: user.id,
            callMode: kind,
          });

          if (result && isMounted) {
            setActiveSessionId(result.sessionId);

            // Register outgoing call with CallKit
            void callKit.startOutgoingCall({
              callUuid: result.sessionId,
              handle: conversationId,
              contactName: 'DeltanHub Member',
              isVideo: kind === 'video',
            });

            // Prepare local SDP offer
            void engine.createOffer().catch(() => {});

            // Broadcast zero-DB incoming call notification with guaranteed channel teardown
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

          // 35s timeout if unanswered
          ringTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              handleEndCall();
            }
          }, 35000);
        } else {
          // Receiver flow: resolve activeSessionId if missing from deep link
          if (!activeSessionId) {
            const activeSession = await callRepository.fetchActiveCallSession(conversationId);
            if (activeSession && isMounted) {
              setActiveSessionId(activeSession.id);
            }
          }

          void callRingtoneService.stopAllRingtones();
          setCallPhase('connected');
          void callKit.reportConnectedCall(activeSessionId || undefined);
          if (activeSessionId) {
            void connectionService.dismissIncomingCallNotification(activeSessionId);
          }
          void configureAudioForCall({ isSpeakerOn: false });
          if (kind === 'audio') {
            proximityService.enableProximity();
          }
          if (!durationTimerRef.current) {
            durationTimerRef.current = setInterval(() => {
              setCallDuration((d) => d + 1);
            }, 1000);
          }
        }
      } catch (err: any) {
        void callRingtoneService.stopAllRingtones();
        const rawMsg = err?.message || '';
        const userMsg =
          rawMsg.includes('chat_call_sessions_one_active_per_conversation_idx') ||
          rawMsg.includes('duplicate key')
            ? 'A call in this chat is currently ending. Please try again in a few seconds.'
            : rawMsg || 'Unable to initialize call';
        Alert.alert('Call Setup Error', userMsg);
        router.back();
      }
    }

    initCall();

    return () => {
      isMounted = false;
      void callRingtoneService.stopAllRingtones();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      void resetAudioAfterCall();
      void callKit.endCall();
      proximityService.disableProximity();
      if (activeSessionId) {
        void connectionService.dismissIncomingCallNotification(activeSessionId);
      }
      mediaEngineRef.current?.close();
      mediaEngineRef.current = null;
    };
  }, [conversationId, role, kind]);

  // 3. Supabase Realtime Broadcast signaling with clean channel teardown
  useEffect(() => {
    if (!activeSessionId || !currentUser) return;

    const liveChannelName = `chat-call-live:${activeSessionId}`;
    const existingLive = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${liveChannelName}` || (ch as any).subTopic === liveChannelName
    );
    if (existingLive) {
      void supabase.removeChannel(existingLive);
    }

    const liveChannel = supabase.channel(liveChannelName);
    liveChannelRef.current = liveChannel;

    liveChannel
      .on('broadcast', { event: 'signal' }, (payload: any) => {
        const sig = payload?.payload as ChatCallSignal;
        if (!sig || sig.senderUserId === currentUser.id) return;
        console.log('[WebRTC Live Signal]', sig.signalType);

        if (sig.signalType === 'offer') {
          if (sig.payload?.sdp && mediaEngineRef.current && currentUser && partnerUserId) {
            void mediaEngineRef.current
              .handleRemoteOfferAndCreateAnswer(sig.payload.sdp)
              .then((answer) => {
                sendLiveCallSignal(liveChannelRef.current, {
                  callId: activeSessionId,
                  conversationId,
                  senderUserId: currentUser.id,
                  recipientUserId: partnerUserId,
                  signalType: 'answer',
                  payload: answer,
                });
              });
          }
        } else if (sig.signalType === 'answer') {
          if (sig.payload?.sdp && mediaEngineRef.current) {
            void mediaEngineRef.current.handleRemoteAnswer(sig.payload.sdp);
          }
        } else if (sig.signalType === 'ice-candidate') {
          if (sig.payload?.candidate && mediaEngineRef.current) {
            void mediaEngineRef.current.addIceCandidate({
              candidate: String(sig.payload.candidate),
              sdpMid: sig.payload.sdpMid ?? null,
              sdpMLineIndex: typeof sig.payload.sdpMLineIndex === 'number' ? sig.payload.sdpMLineIndex : null,
              usernameFragment: sig.payload.usernameFragment ?? null,
            });
          }
        } else if (sig.signalType === 'hangup') {
          void callRingtoneService.stopAllRingtones();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setCallPhase('ended');
          if (durationTimerRef.current) clearInterval(durationTimerRef.current);
          void resetAudioAfterCall();
          void callKit.endCall();
          proximityService.disableProximity();
          if (activeSessionId) {
            void connectionService.dismissIncomingCallNotification(activeSessionId);
          }
          setTimeout(() => {
            router.back();
          }, 800);
        } else if (sig.signalType === 'media-state') {
          if (typeof sig.payload?.isMuted === 'boolean') {
            setRemoteIsMuted(sig.payload.isMuted);
          }
          if (typeof sig.payload?.isVideoOff === 'boolean') {
            setRemoteIsVideoOff(sig.payload.isVideoOff);
          }
        } else if (sig.signalType === 'upgrade-to-video') {
          console.log('[WebRTC Live Signal] Remote partner upgraded call to video');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setActiveCallKind('video');
          setIsVideoOff(false);
          void mediaEngineRef.current?.upgradeToVideoMedia().then((updatedStream: any) => {
            if (updatedStream) setLocalStream(updatedStream);
          });
        }
      })
      .subscribe();

    return () => {
      if (liveChannelRef.current) {
        void supabase.removeChannel(liveChannelRef.current);
        liveChannelRef.current = null;
      }
    };
  }, [activeSessionId, currentUser]);

  // 4. Broadcast local media-state changes to remote peer
  useEffect(() => {
    if (callPhase === 'connected' && activeSessionId && currentUser && partnerUserId) {
      sendLiveCallSignal(liveChannelRef.current, {
        callId: activeSessionId,
        conversationId,
        senderUserId: currentUser.id,
        recipientUserId: partnerUserId,
        signalType: 'media-state',
        payload: { isMuted, isVideoOff },
      });
    }
  }, [isMuted, isVideoOff, callPhase, activeSessionId, currentUser, partnerUserId, conversationId]);

  // 5. Realtime listener on chat_call_sessions
  useEffect(() => {
    if (!conversationId) return;

    const callSyncChannelName = `call-session-sync-${conversationId}`;
    const existingSync = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${callSyncChannelName}` || (ch as any).subTopic === callSyncChannelName
    );
    if (existingSync) {
      void supabase.removeChannel(existingSync);
    }

    const channel = supabase
      .channel(callSyncChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_call_sessions',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (!updated) return;

          if (updated.call_status === 'accepted') {
            void callRingtoneService.stopAllRingtones();
            setCallPhase('connected');
            void configureAudioForCall({ isSpeakerOn });
            if (kind === 'audio' && !isSpeakerOn) {
              proximityService.enableProximity();
            }
            if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
            if (!durationTimerRef.current) {
              durationTimerRef.current = setInterval(() => {
                setCallDuration((d) => d + 1);
              }, 1000);
            }
          } else if (
            updated.call_status === 'ended' ||
            updated.call_status === 'declined' ||
            updated.call_status === 'missed' ||
            updated.call_status === 'canceled'
          ) {
            void callRingtoneService.stopAllRingtones();
            setCallPhase('ended');
            if (durationTimerRef.current) clearInterval(durationTimerRef.current);
            void resetAudioAfterCall();
            proximityService.disableProximity();
            setTimeout(() => {
              router.back();
            }, 800);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, isSpeakerOn, kind]);

  const handleAcceptCall = async () => {
    void callRingtoneService.stopAllRingtones();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallPhase('connected');
    void callKit.reportConnectedCall(activeSessionId || undefined);
    if (activeSessionId) {
      void connectionService.dismissIncomingCallNotification(activeSessionId);
    }
    void configureAudioForCall({ isSpeakerOn });
    if (kind === 'audio' && !isSpeakerOn) {
      proximityService.enableProximity();
    }
    if (!durationTimerRef.current) {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }

    if (activeSessionId && currentUser) {
      void updateServerCallSession(activeSessionId, 'accept').catch(() => {});
      void callRepository.updateCallSession(activeSessionId, {
        callStatus: 'accepted',
        acceptedAt: new Date().toISOString(),
      });
      void callRepository.updateParticipantStatus(activeSessionId, currentUser.id, 'accepted', {
        field: 'joined_at',
        value: new Date().toISOString(),
      });
    }
  };

  const handleDeclineCall = async () => {
    void callRingtoneService.stopAllRingtones();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallPhase('ended');
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    void resetAudioAfterCall();
    void callKit.endCall(activeSessionId || undefined);
    proximityService.disableProximity();
    if (activeSessionId) {
      void connectionService.dismissIncomingCallNotification(activeSessionId);
    }

    if (activeSessionId && currentUser && partnerUserId) {
      sendLiveCallSignal(liveChannelRef.current, {
        callId: activeSessionId,
        conversationId,
        senderUserId: currentUser.id,
        recipientUserId: partnerUserId,
        signalType: 'hangup',
        payload: { reason: 'recipient_declined' },
      });

      void updateServerCallSession(activeSessionId, 'decline').catch(() => {});
      void callRepository
        .recordCallLogFallback({
          callId: activeSessionId,
          conversationId,
          actorUserId: currentUser.id,
          partnerUserId,
          callMode: kind === 'video' ? 'video' : 'audio',
          action: 'decline',
          durationSeconds: 0,
        })
        .catch(() => {});

      void callRepository.updateCallSession(activeSessionId, {
        callStatus: 'declined',
        endedAt: new Date().toISOString(),
        endedByUserId: currentUser.id,
        endReason: 'recipient_declined',
      });
      void callRepository.updateParticipantStatus(activeSessionId, currentUser.id, 'declined', {
        field: 'left_at',
        value: new Date().toISOString(),
      });
    }
    setTimeout(() => {
      router.back();
    }, 600);
  };

  const handleEndCall = async () => {
    void callRingtoneService.stopAllRingtones();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prevPhase = callPhase;
    setCallPhase('ended');
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    void resetAudioAfterCall();
    void callKit.endCall(activeSessionId || undefined);
    proximityService.disableProximity();
    if (activeSessionId) {
      void connectionService.dismissIncomingCallNotification(activeSessionId);
    }

    if (role === 'initiator' && prevPhase === 'outgoing' && partnerUserId && activeSessionId) {
      void dispatchVoipCallCancellation({
        callId: activeSessionId,
        conversationId,
        recipientUserIds: [partnerUserId],
        reason: 'caller_hangup',
      });
    }

    if (activeSessionId && currentUser && partnerUserId) {
      sendLiveCallSignal(liveChannelRef.current, {
        callId: activeSessionId,
        conversationId,
        senderUserId: currentUser.id,
        recipientUserId: partnerUserId,
        signalType: 'hangup',
        payload: { reason: 'ended_by_user' },
      });

      const finalAction =
        prevPhase === 'connected' ? 'end' : role === 'initiator' ? 'cancel' : 'missed';
      void updateServerCallSession(
        activeSessionId,
        finalAction === 'cancel' || finalAction === 'missed' ? 'missed' : 'end'
      ).catch(() => {});

      void callRepository
        .recordCallLogFallback({
          callId: activeSessionId,
          conversationId,
          actorUserId: currentUser.id,
          partnerUserId,
          callMode: kind === 'video' ? 'video' : 'audio',
          action: finalAction,
          durationSeconds: callDuration,
        })
        .catch(() => {});

      void callRepository.updateCallSession(activeSessionId, {
        callStatus:
          finalAction === 'cancel' ? 'canceled' : finalAction === 'missed' ? 'missed' : 'ended',
        endedAt: new Date().toISOString(),
        endedByUserId: currentUser.id,
        durationSeconds: callDuration,
        endReason: 'ended_by_participant',
      });
      void callRepository.updateParticipantStatus(activeSessionId, currentUser.id, 'left', {
        field: 'left_at',
        value: new Date().toISOString(),
      });
    }

    setTimeout(() => {
      router.back();
    }, 600);
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      const nextRoute: AudioRoute = next ? 'speaker' : 'earpiece';
      setAudioRouteState(nextRoute);
      void setSpeakerphone(next);
      if (next) {
        proximityService.disableProximity();
      } else if (callPhase === 'connected' && activeCallKind === 'audio') {
        proximityService.enableProximity();
      }
      return next;
    });
  };

  const handleSetAudioRoute = useCallback(async (route: AudioRoute) => {
    setAudioRouteState(route);
    setIsSpeakerOn(route === 'speaker');
    await setAudioRoute(route);
    if (route === 'earpiece' && callPhase === 'connected' && activeCallKind === 'audio') {
      proximityService.enableProximity();
    } else {
      proximityService.disableProximity();
    }
  }, [callPhase, activeCallKind]);

  const handleRestartIce = useCallback(async () => {
    if (!mediaEngineRef.current || !activeSessionId || !currentUser || !partnerUserId) return;
    try {
      setConnectionHealth('reconnecting');
      const offer = await mediaEngineRef.current.restartIce();
      sendLiveCallSignal(liveChannelRef.current, {
        callId: activeSessionId,
        conversationId,
        senderUserId: currentUser.id,
        recipientUserId: partnerUserId,
        signalType: 'offer',
        payload: { sdp: offer.sdp, isIceRestart: true },
      });
    } catch (err) {
      console.warn('[useCallSession] Failed to trigger ICE restart:', err);
    }
  }, [activeSessionId, currentUser, partnerUserId, conversationId]);

  return {
    callPhase,
    partnerName,
    partnerAvatarUrl,
    partnerRole,
    callDuration,
    isMuted,
    isSpeakerOn,
    isVideoOff,
    remoteIsMuted,
    remoteIsVideoOff,
    handleAcceptCall,
    handleDeclineCall,
    handleEndCall,
    activeCallKind,
    handleToggleMute: () => {
      setIsMuted((m) => {
        const next = !m;
        void callKit.setMuted(next);
        mediaEngineRef.current?.setAudioMuted(next);
        return next;
      });
    },
    handleToggleSpeaker,
    handleSetAudioRoute,
    handleRestartIce,
    handleUpgradeToVideo: async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveCallKind('video');
      setIsVideoOff(false);
      const updatedStream = await mediaEngineRef.current?.upgradeToVideoMedia();
      if (updatedStream) setLocalStream(updatedStream);

      if (activeSessionId && currentUser && partnerUserId) {
        sendLiveCallSignal(liveChannelRef.current, {
          callId: activeSessionId,
          conversationId,
          senderUserId: currentUser.id,
          recipientUserId: partnerUserId,
          signalType: 'upgrade-to-video',
          payload: { requestedBy: currentUser.id },
        });
        void callRepository.updateCallSession(activeSessionId, {
          callMode: 'video',
        });
      }
    },
    handleToggleVideo: async () => {
      if (activeCallKind === 'audio') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setActiveCallKind('video');
        setIsVideoOff(false);
        const updatedStream = await mediaEngineRef.current?.upgradeToVideoMedia();
        if (updatedStream) setLocalStream(updatedStream);

        if (activeSessionId && currentUser && partnerUserId) {
          sendLiveCallSignal(liveChannelRef.current, {
            callId: activeSessionId,
            conversationId,
            senderUserId: currentUser.id,
            recipientUserId: partnerUserId,
            signalType: 'upgrade-to-video',
            payload: { requestedBy: currentUser.id },
          });
          void callRepository.updateCallSession(activeSessionId, {
            callMode: 'video',
          });
        }
      } else {
        setIsVideoOff((v) => {
          const next = !v;
          mediaEngineRef.current?.setVideoMuted(next);
          return next;
        });
      }
    },
    handleSwitchCamera: () => {
      mediaEngineRef.current?.switchCamera();
    },
    localStream,
    remoteStream,
    connectionHealth,
    audioRoute,
  };
}
