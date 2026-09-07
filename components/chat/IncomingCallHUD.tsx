import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import * as Haptics from '../../lib/haptics';
import { resolveAvatarUrl } from '../../lib/media-utils';
import SafeBlurView from '../SafeBlurView';
import ScalePressable from '../ScalePressable';

interface IncomingCallData {
  callId: string;
  conversationId: string;
  callMode: 'audio' | 'video';
  callerUserId: string;
  callerName: string;
  callerAvatarUrl: string | null;
}

export default function IncomingCallHUD() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const ringScale = useSharedValue(1);

  const hapticIntervalRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);
  const activeSessionChannelRef = useRef<any>(null);
  const incomingCallRef = useRef<IncomingCallData | null>(null);
  incomingCallRef.current = incomingCall;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const dismissHUD = useCallback(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (activeSessionChannelRef.current) {
      void supabase.removeChannel(activeSessionChannelRef.current);
      activeSessionChannelRef.current = null;
    }

    translateY.value = withTiming(-200, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setIncomingCall)(null);
      }
    });
    opacity.value = withTiming(0, { duration: 200 });
  }, [translateY, opacity]);

  const handleAccept = useCallback(async () => {
    if (!incomingCall || !currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const callSnapshot = { ...incomingCall };
    dismissHUD();

    try {
      await supabase
        .from('chat_call_sessions')
        .update({
          call_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', callSnapshot.callId);

      await supabase
        .from('chat_call_participants')
        .update({
          participant_status: 'accepted',
          joined_at: new Date().toISOString(),
        })
        .eq('call_id', callSnapshot.callId)
        .eq('user_id', currentUser.id);

      router.push({
        pathname: '/call/[id]',
        params: {
          id: callSnapshot.conversationId,
          kind: callSnapshot.callMode,
          role: 'receiver',
          callId: callSnapshot.callId,
        },
      });
    } catch (err) {
      console.warn('Error accepting call session:', err);
    }
  }, [incomingCall, currentUser, dismissHUD, router]);

  const handleDecline = useCallback(async () => {
    if (!incomingCall || !currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const callSnapshot = { ...incomingCall };
    dismissHUD();

    try {
      await supabase
        .from('chat_call_sessions')
        .update({
          call_status: 'declined',
          ended_at: new Date().toISOString(),
          ended_by_user_id: currentUser.id,
          end_reason: 'recipient_declined',
        })
        .eq('id', callSnapshot.callId);

      await supabase
        .from('chat_call_participants')
        .update({
          participant_status: 'declined',
          left_at: new Date().toISOString(),
        })
        .eq('call_id', callSnapshot.callId)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Error declining call session:', err);
    }
  }, [incomingCall, currentUser, dismissHUD]);

  const presentIncomingCall = useCallback(
    (callData: IncomingCallData) => {
      if (incomingCallRef.current) {
        // If already handling a call, decline incoming secondary call as busy
        void supabase
          .from('chat_call_sessions')
          .update({
            call_status: 'declined',
            ended_at: new Date().toISOString(),
            end_reason: 'recipient_busy',
          })
          .eq('id', callData.callId);
        return;
      }

      setIncomingCall(callData);

      translateY.value = withSpring(0, {
        mass: 1,
        stiffness: 100,
        damping: 15,
      });
      opacity.value = withTiming(1, { duration: 200 });

      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );

      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      hapticIntervalRef.current = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 1600);

      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = setTimeout(() => {
        dismissHUD();
      }, 35000);

      if (activeSessionChannelRef.current) {
        void supabase.removeChannel(activeSessionChannelRef.current);
      }
      const syncChannelName = 'call-status-listener-' + callData.callId;
      const existingSync = supabase.getChannels().find(
        (ch) => ch.topic === `realtime:${syncChannelName}` || (ch as any).subTopic === syncChannelName
      );
      if (existingSync) {
        void supabase.removeChannel(existingSync);
      }
      activeSessionChannelRef.current = supabase
        .channel(syncChannelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_call_sessions',
            filter: 'id=eq.' + callData.callId,
          },
          (updatePayload: any) => {
            const status = updatePayload.new?.call_status;
            if (
              status === 'ended' ||
              status === 'declined' ||
              status === 'missed' ||
              status === 'canceled'
            ) {
              dismissHUD();
            }
          }
        )
        .subscribe();
    },
    [dismissHUD, translateY, opacity, ringScale]
  );

  useEffect(() => {
    if (!currentUser) return;

    // Targeted user-scoped channel: eliminates global 500k CCU broadcast storms
    const channelName = 'user-call-listener-' + currentUser.id;
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || (ch as any).subTopic === channelName
    );
    if (existing) {
      void supabase.removeChannel(existing);
    }
    const userCallChannel = supabase
      .channel(channelName)
      // 1. Zero-DB-load Realtime Broadcast from caller
      .on('broadcast', { event: 'incoming_call' }, async (payload: any) => {
        const callData = payload?.payload;
        if (!callData || callData.callerUserId === currentUser.id) return;
        presentIncomingCall(callData);
      })
      // 2. Targeted Postgres CDC strictly filtered to currentUser.id on chat_call_participants
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_call_participants',
          filter: `user_id=eq.${currentUser.id}`,
        },
        async (payload: any) => {
          const participant = payload.new;
          if (
            !participant ||
            participant.is_initiator ||
            participant.participant_status !== 'invited'
          ) {
            return;
          }

          // Single targeted lookup for the specific session
          const { data: session } = await supabase
            .from('chat_call_sessions')
            .select('id, conversation_id, call_mode, initiated_by_user_id, call_status')
            .eq('id', participant.call_id)
            .maybeSingle();

          if (!session || session.call_status !== 'ringing') return;

          let callerName = 'DeltanHub Member';
          let callerAvatarUrl: string | null = null;

          try {
            const { data: profiles } = await supabase.rpc('get_public_user_profiles', {
              requested_user_ids: [session.initiated_by_user_id],
            });

            if (profiles && profiles[0]) {
              callerName =
                profiles[0].display_name?.trim() ||
                profiles[0].full_name?.trim() ||
                'DeltanHub Member';
              callerAvatarUrl = resolveAvatarUrl(profiles[0].avatar_url);
            }
          } catch (e) {}

          const callData: IncomingCallData = {
            callId: session.id,
            conversationId: session.conversation_id,
            callMode: session.call_mode === 'video' ? 'video' : 'audio',
            callerUserId: session.initiated_by_user_id,
            callerName,
            callerAvatarUrl,
          };

          presentIncomingCall(callData);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(userCallChannel);
      dismissHUD();
    };
  }, [currentUser, dismissHUD, translateY, opacity, ringScale]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  if (!incomingCall) {
    return null;
  }

  const isVideo = incomingCall.callMode === 'video';

  return (
    <Animated.View
      style={[
        styles.overlayContainer,
        { paddingTop: insets.top + (Platform.OS === 'ios' ? 6 : 10) },
        animatedContainerStyle,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.cardWrapper}>
        <SafeBlurView
          intensity={85}
          tint="dark"
          fallbackBackgroundColor="rgba(20, 20, 24, 0.96)"
          style={styles.blurCard}
        >
          <View style={styles.cardContent}>
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { borderColor: isVideo ? '#60a5fa' : '#4ade80' },
                  animatedRingStyle,
                ]}
              />
              {incomingCall.callerAvatarUrl ? (
                <Image
                  source={{ uri: incomingCall.callerAvatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {(incomingCall.callerName || 'U').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.textDetails}>
              <Text style={styles.callerName} numberOfLines={1}>
                {incomingCall.callerName}
              </Text>
              <View style={styles.kindRow}>
                <Ionicons
                  name={isVideo ? 'videocam' : 'call'}
                  size={12}
                  color={isVideo ? '#60a5fa' : '#4ade80'}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.callKindText}>
                  Incoming {isVideo ? 'Video' : 'Voice'} Call
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <ScalePressable
                onPress={handleDecline}
                accessibilityRole="button"
                accessibilityLabel="Decline Call"
                accessibilityHint="Declines the incoming call"
                style={[styles.actionBtn, styles.declineBtn]}
              >
                <Ionicons name="call" size={22} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
              </ScalePressable>

              <ScalePressable
                onPress={handleAccept}
                accessibilityRole="button"
                accessibilityLabel={isVideo ? 'Accept Video Call' : 'Accept Voice Call'}
                accessibilityHint="Answers and connects the incoming call"
                style={[styles.actionBtn, styles.acceptBtn]}
              >
                <Ionicons name={isVideo ? 'videocam' : 'call'} size={22} color="#ffffff" />
              </ScalePressable>
            </View>
          </View>
        </SafeBlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  blurCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    opacity: 0.7,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272a',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a0b18',
  },
  avatarInitial: {
    color: '#f4e7eb',
    fontSize: 16,
    fontWeight: '700',
  },
  textDetails: {
    flex: 1,
    marginRight: 12,
  },
  callerName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callKindText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  declineBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#10b981',
  },
});