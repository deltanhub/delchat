import React from 'react';
import { View } from 'react-native';
import {
  CallControlsDockProps,
  styles,
  VideoControlsPill,
  IncomingCallActions,
  InCallAudioControls,
} from './controls';

export { CallControlsDockProps } from './controls';

export const CallControlsDock: React.FC<CallControlsDockProps> = ({
  phase,
  callKind,
  isMuted = false,
  isSpeakerOn = false,
  isVideoOff = false,
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onSwitchCamera,
  bottomInset,
}) => {
  const isVideoMode = callKind === 'video';
  const isIncoming = phase === 'incoming';
  const isConnected = phase === 'connected';

  // CASE 1: Video In-Call Floating Dock
  if (isVideoMode && isConnected) {
    return (
      <VideoControlsPill
        bottomInset={bottomInset}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isSpeakerOn={isSpeakerOn}
        onToggleMute={onToggleMute}
        onSwitchCamera={onSwitchCamera}
        onToggleVideo={onToggleVideo}
        onToggleSpeaker={onToggleSpeaker}
        onEndCall={onEndCall}
      />
    );
  }

  // CASE 2: Audio Call or Outgoing/Incoming Dock
  return (
    <View style={[styles.controlsSection, { paddingBottom: Math.max(bottomInset, 32) }]}>
      {isIncoming ? (
        <IncomingCallActions onAccept={onAccept} onDecline={onDecline} />
      ) : (
        <InCallAudioControls
          isVideoMode={isVideoMode}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          isVideoOff={isVideoOff}
          onToggleMute={onToggleMute}
          onToggleSpeaker={onToggleSpeaker}
          onToggleVideo={onToggleVideo}
          onEndCall={onEndCall}
        />
      )}
    </View>
  );
};
