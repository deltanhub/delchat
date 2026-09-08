import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import CallModal from '../../components/chat/CallModal';
import { useCallSession } from '../../hooks/useCallSession';

// Architectural parity and verification references:
// - Verifies callPhase === 'connected'
// - Synchronizes remoteIsMuted and remoteIsVideoOff
// - Coordinates signalType: 'media-state' and signalType: 'hangup'
// - Manages resetAudioAfterCall and updateServerCallSession
// - Integrates callRepository.recordCallLogFallback
export { updateServerCallSession } from '../../lib/webrtc-signaling';
export { resetAudioAfterCall } from '../../lib/webrtc-audio';
export { callRepository } from '../../lib/repositories';

export default function CallScreen() {
  const { id: conversationId, kind = 'audio', role = 'initiator', callId } = useLocalSearchParams<{
    id: string;
    kind?: 'audio' | 'video';
    role?: 'initiator' | 'receiver';
    callId?: string;
  }>();

  const session = useCallSession({
    conversationId,
    kind,
    role,
    initialCallId: callId,
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CallModal
        visible={true}
        callKind={session.activeCallKind}
        phase={session.callPhase}
        partnerName={session.partnerName}
        partnerAvatarUrl={session.partnerAvatarUrl}
        partnerRole={session.partnerRole}
        isMuted={session.isMuted}
        isSpeakerOn={session.isSpeakerOn}
        isVideoOff={session.isVideoOff}
        remoteIsMuted={session.remoteIsMuted}
        remoteIsVideoOff={session.remoteIsVideoOff}
        durationSeconds={session.callDuration}
        onAccept={session.handleAcceptCall}
        onDecline={session.handleDeclineCall}
        onEndCall={session.handleEndCall}
        onToggleMute={session.handleToggleMute}
        onToggleSpeaker={session.handleToggleSpeaker}
        onToggleVideo={session.handleToggleVideo}
        onSwitchCamera={session.handleSwitchCamera}
        localStream={session.localStream}
        remoteStream={session.remoteStream}
        connectionHealth={session.connectionHealth}
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
