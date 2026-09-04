import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import CallModal, { CallPhase } from '../../components/chat/CallModal';
import * as Haptics from '../../lib/haptics';
import { resolveAvatarUrl } from '../../lib/media-utils';
import {
  fetchIceConfig,
  sendLiveCallSignal,
  updateServerCallSession,
  ChatCallSignal,
} from '../../lib/webrtc-signaling';
import {
  configureAudioForCall,
  setSpeakerphone,
  resetAudioAfterCall,
} from '../../lib/webrtc-audio';

export default function CallScreen() {
  const { id: conversationId, kind = 'audio', role = 'initiator', callId } = useLocalSearchParams<{
    id: string;
    kind?: 'audio' | 'video';
    role?: 'initiator' | 'receiver';
    callId?: string;
  }>();

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [callPhase, setCallPhase] = useState<CallPhase>(role === 'receiver' ? 'connected' : 'outgoing');
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('DeltanHub Member');
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);
  const [partnerRole, setPartnerRole] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteIsMuted, setRemoteIsMuted] = useState(false);
  const [remoteIsVideoOff, setRemoteIsVideoOff] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(callId || null);

  const durationTimerRef = useRef<any>(null);
  const ringTimeoutRef = useRef<any>(null);
  const liveChannelRef = useRef<any>(null);

  // 1. Fetch ICE configuration (Cloudflare Calls TURN / STUN)
  useEffect(() => {
    fetchIceConfig()
      .then((config) => {
        console.log('[WebRTC ICE Config]', config?.relayConfigured ? 'TURN active' : 'STUN active');
      })
      .catch(() => {});
  }, []);

  // 2. Initialize Call Lifecycle & Hardware Audio
  useEffect(() => {
    let isMounted = true;

    async function initCall() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
            setPartnerName(profiles[0].display_name?.trim() || profiles[0].full_name?.trim() || 'Partner');
            setPartnerAvatarUrl(resolveAvatarUrl(profiles[0].avatar_url));
            setPartnerRole(partner.participant_role || 'Member');
          }
        }

        if (role === 'initiator') {
          setCallPhase('outgoing');
          const expiresAt = new Date(Date.now() + 90000).toISOString();

          // Create call session with correct call_mode column
          const { data: session, error } = await supabase
            .from('chat_call_sessions')
            .insert({
              conversation_id: conversationId,
              initiated_by_user_id: user.id,
              call_mode: kind,
              call_status: 'ringing',
              expires_at: expiresAt,
            })
            .select('id')
            .single();

          if (error) throw error;
          if (session && isMounted) {
            setActiveSessionId(session.id);

            // Populate call participants
            const { data: convParticipants } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('conversation_id', conversationId)
              .is('removed_at', null);

            if (convParticipants && convParticipants.length > 0) {
              await supabase.from('chat_call_participants').upsert(
                convParticipants.map((p: any) => ({
                  call_id: session.id,
                  conversation_id: conversationId,
                  user_id: p.user_id,
                  participant_status: p.user_id === user.id ? 'accepted' : 'invited',
                  is_initiator: p.user_id === user.id,
                  joined_at: p.user_id === user.id ? new Date().toISOString() : null,
                }))
              );

              // Broadcast instant zero-DB incoming call notification to invited recipients
              convParticipants
                .filter((p: any) => p.user_id !== user.id)
                .forEach((p: any) => {
                  const notifyChannel = supabase.channel(`user-call-listener-${p.user_id}`);
                  notifyChannel.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                      void notifyChannel.send({
                        type: 'broadcast',
                        event: 'incoming_call',
                        payload: {
                          callId: session.id,
                          conversationId,
                          callMode: kind,
                          callerUserId: user.id,
                          callerName: user.user_metadata?.full_name || 'DeltanHub Member',
                          callerAvatarUrl: resolveAvatarUrl(user.user_metadata?.avatar_url),
                        },
                      });
                    }
                  });
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
          // Receiver accepted via HUD
          setCallPhase('connected');
          void configureAudioForCall({ isSpeakerOn: false });
          if (!durationTimerRef.current) {
            durationTimerRef.current = setInterval(() => {
              setCallDuration((d) => d + 1);
            }, 1000);
          }
        }
      } catch (err: any) {
        Alert.alert('Call Setup Error', err.message || 'Unable to initialize call');
        router.back();
      }
    }

    initCall();

    return () => {
      isMounted = false;
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      void resetAudioAfterCall();
    };
  }, [conversationId, role, kind]);

  // 3. Setup Supabase Realtime Broadcast signaling (zero-DB-load, matching DeltanHub web)
  useEffect(() => {
    if (!activeSessionId || !currentUser) return;

    const liveChannel = supabase.channel(`chat-call-live:${activeSessionId}`);
    liveChannelRef.current = liveChannel;

    liveChannel
      .on('broadcast', { event: 'signal' }, (payload: any) => {
        const sig = payload?.payload as ChatCallSignal;
        if (!sig || sig.senderUserId === currentUser.id) return;
        console.log('[WebRTC Live Signal]', sig.signalType);

        if (sig.signalType === 'hangup') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setCallPhase('ended');
          if (durationTimerRef.current) clearInterval(durationTimerRef.current);
          void resetAudioAfterCall();
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

    const channel = supabase
      .channel(`call-session-sync-${conversationId}`)
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
            setCallPhase('connected');
            void configureAudioForCall({ isSpeakerOn });
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
            setCallPhase('ended');
            if (durationTimerRef.current) clearInterval(durationTimerRef.current);
            void resetAudioAfterCall();
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
  }, [conversationId, isSpeakerOn]);

  const handleAcceptCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallPhase('connected');
    void configureAudioForCall({ isSpeakerOn: false });
    if (!durationTimerRef.current) {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }

    if (activeSessionId && currentUser) {
      void updateServerCallSession(activeSessionId, 'accept').catch(() => {});
      void supabase
        .from('chat_call_sessions')
        .update({
          call_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', activeSessionId);

      void supabase
        .from('chat_call_participants')
        .update({
          participant_status: 'accepted',
          joined_at: new Date().toISOString(),
        })
        .eq('call_id', activeSessionId)
        .eq('user_id', currentUser.id);
    }
  };

  const handleDeclineCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallPhase('ended');
    void resetAudioAfterCall();

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
      void supabase
        .from('chat_call_sessions')
        .update({
          call_status: 'declined',
          ended_at: new Date().toISOString(),
          ended_by_user_id: currentUser.id,
          end_reason: 'recipient_declined',
        })
        .eq('id', activeSessionId);

      void supabase
        .from('chat_call_participants')
        .update({
          participant_status: 'declined',
          left_at: new Date().toISOString(),
        })
        .eq('call_id', activeSessionId)
        .eq('user_id', currentUser.id);
    }
    setTimeout(() => {
      router.back();
    }, 600);
  };

  const handleEndCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallPhase('ended');
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    void resetAudioAfterCall();

    if (activeSessionId && currentUser && partnerUserId) {
      sendLiveCallSignal(liveChannelRef.current, {
        callId: activeSessionId,
        conversationId,
        senderUserId: currentUser.id,
        recipientUserId: partnerUserId,
        signalType: 'hangup',
        payload: { reason: 'ended_by_user' },
      });

      void updateServerCallSession(activeSessionId, 'end').catch(() => {});
      void supabase
        .from('chat_call_sessions')
        .update({
          call_status: 'ended',
          ended_at: new Date().toISOString(),
          ended_by_user_id: currentUser.id,
          duration_seconds: callDuration,
          end_reason: 'ended_by_participant',
        })
        .eq('id', activeSessionId);

      void supabase
        .from('chat_call_participants')
        .update({
          participant_status: 'left',
          left_at: new Date().toISOString(),
        })
        .eq('call_id', activeSessionId)
        .eq('user_id', currentUser.id);
    }

    setTimeout(() => {
      router.back();
    }, 600);
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      void setSpeakerphone(next);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <CallModal
        visible={true}
        callKind={kind}
        phase={callPhase}
        partnerName={partnerName}
        partnerAvatarUrl={partnerAvatarUrl}
        partnerRole={partnerRole}
        isMuted={isMuted}
        isSpeakerOn={isSpeakerOn}
        isVideoOff={isVideoOff}
        remoteIsMuted={remoteIsMuted}
        remoteIsVideoOff={remoteIsVideoOff}
        durationSeconds={callDuration}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
        onEndCall={handleEndCall}
        onToggleMute={() => setIsMuted((m) => !m)}
        onToggleSpeaker={handleToggleSpeaker}
        onToggleVideo={() => setIsVideoOff((v) => !v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
