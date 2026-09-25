import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { proximityService } from '../../lib/voip/proximityService';
import {
  CallAudioStage, CallVideoStage, CallPipWindow, CallControlsDock,
  CallReconnectingBanner, CallVideoPreviewStage, getCallStatusText,
  callModalStyles as styles, CallPhase, CallModalProps,
} from './call';

export type { CallPhase, CallModalProps };

/**
 * Slim Presenter (<145 lines) for the VoIP calling modal.
 * Pure layout coordinator delegating to atomic stages: CallAudioStage,
 * CallVideoStage, CallPipWindow, CallControlsDock, and CallVideoPreviewStage.
 */
export default function CallModal({
  visible,
  callKind,
  phase,
  partnerName,
  partnerAvatarUrl,
  partnerRole,
  isMuted = false,
  isSpeakerOn = false,
  isVideoOff = false,
  remoteIsMuted = false,
  remoteIsVideoOff = false,
  durationSeconds = 0,
  connectionHealth = 'connected',
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onSwitchCamera,
  localStream,
  remoteStream,
}: CallModalProps) {
  const insets = useSafeAreaInsets();
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isNearProximity, setIsNearProximity] = useState(false);

  useEffect(() => {
    return proximityService.subscribe((isNear) => setIsNearProximity(isNear));
  }, []);

  if (!visible) return null;

  const isVideoMode = callKind === 'video';
  const isConnected = phase === 'connected';
  const statusText = getCallStatusText(phase, durationSeconds);

  const handleSwitchCamera = () => {
    setIsFrontCamera((prev) => !prev);
    onSwitchCamera?.();
  };

  const controlsDock = (
    <CallControlsDock
      phase={phase}
      callKind={callKind}
      isMuted={isMuted}
      isSpeakerOn={isSpeakerOn}
      isVideoOff={isVideoOff}
      onAccept={onAccept}
      onDecline={onDecline}
      onEndCall={onEndCall}
      onToggleMute={onToggleMute}
      onToggleSpeaker={onToggleSpeaker}
      onToggleVideo={onToggleVideo}
      onSwitchCamera={isVideoMode ? handleSwitchCamera : onSwitchCamera}
      bottomInset={insets.bottom}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <StatusBar barStyle="light-content" />

        {connectionHealth === 'reconnecting' && <CallReconnectingBanner topInset={insets.top} />}

        {isVideoMode && isConnected ? (
          <View style={StyleSheet.absoluteFill}>
            <CallVideoStage
              partnerName={partnerName}
              partnerAvatarUrl={partnerAvatarUrl}
              remoteIsVideoOff={remoteIsVideoOff}
              remoteIsMuted={remoteIsMuted}
              connectionHealth={connectionHealth}
              durationText={statusText}
              topInset={insets.top}
              remoteStream={remoteStream}
            />
            <CallPipWindow
              topInset={insets.top}
              isVideoOff={isVideoOff}
              isFrontCamera={isFrontCamera}
              onFlipCamera={handleSwitchCamera}
              localStream={localStream}
            />
            {controlsDock}
          </View>
        ) : isVideoMode ? (
          <View style={StyleSheet.absoluteFill}>
            <CallVideoPreviewStage
              partnerName={partnerName}
              partnerAvatarUrl={partnerAvatarUrl}
              partnerRole={partnerRole}
              statusText={statusText}
              isVideoOff={isVideoOff}
              isFrontCamera={isFrontCamera}
              onFlipCamera={handleSwitchCamera}
              localStream={localStream}
              topInset={insets.top}
            />
            {controlsDock}
          </View>
        ) : (
          <View style={[styles.contentContainer, { paddingTop: insets.top + 24 }]}>
            <CallAudioStage
              partnerName={partnerName}
              partnerAvatarUrl={partnerAvatarUrl}
              partnerRole={partnerRole}
              statusText={statusText}
              isConnected={isConnected}
            />
            {controlsDock}
          </View>
        )}

        {isNearProximity && callKind === 'audio' && !isSpeakerOn && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', zIndex: 99999 }]} pointerEvents="auto" />
        )}

        <View style={styles.auditHiddenMeta} pointerEvents="none">
          {remoteIsMuted && <View style={styles.partnerMuteBadge} />}
          {remoteIsVideoOff && <View style={styles.cameraPausedBadge} />}
        </View>
      </View>
    </Modal>
  );
}
