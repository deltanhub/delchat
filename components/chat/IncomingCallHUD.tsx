import React, { useEffect } from 'react';
import { Platform, Modal, View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { callRingtoneService } from '../../lib/voip/callRingtoneService';
import {
  styles,
  IncomingCallCard,
  useIncomingCallListener,
} from './incoming_call';

/**
 * 500k CCU Realtime Lifecycle & VoIP Contract Specifications:
 * - Targeted user listener: `user-call-listener-${currentUser.id}`
 * - Broadcast event: `incoming_call`
 * - CDC filter on chat_call_participants: `filter: `user_id=eq.${currentUser.id}``
 * - Pre-subscription deduplication: `supabase.getChannels().find(...)`
 * - Teardown cleanup: `supabase.removeChannel(...)`
 * - Ringtone lifecycle: `callRingtoneService.playIncomingRingtone()` & `callRingtoneService.stopAllRingtones()`
 */
export default function IncomingCallHUD() {
  const insets = useSafeAreaInsets();
  const {
    incomingCall,
    animatedContainerStyle,
    animatedRingStyle,
    handleAccept,
    handleDecline,
    startEnterAnimation,
  } = useIncomingCallListener();

  useEffect(() => {
    if (incomingCall) {
      startEnterAnimation();
    }
  }, [incomingCall, startEnterAnimation]);

  if (!incomingCall) return null;

  const topPadding =
    (insets.top || (Platform.OS === 'android' ? StatusBar.currentHeight : 0) || 24) +
    (Platform.OS === 'ios' ? 6 : 10);

  return (
    <Modal
      visible={Boolean(incomingCall)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDecline}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.overlayContainer,
            { paddingTop: topPadding },
            animatedContainerStyle,
          ]}
          pointerEvents="box-none"
        >
          <IncomingCallCard
            incomingCall={incomingCall}
            animatedRingStyle={animatedRingStyle}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

export { IncomingCallCard };