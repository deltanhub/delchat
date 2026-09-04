import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import SafeBlurView from '../SafeBlurView';
import * as Haptics from '../../lib/haptics';
import { Typography } from '../../constants/Typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CallPhase = 'outgoing' | 'incoming' | 'connected' | 'ended';

export interface CallModalProps {
  visible: boolean;
  callKind: 'audio' | 'video';
  phase: CallPhase;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerRole?: string | null;
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  isVideoOff?: boolean;
  remoteIsMuted?: boolean;
  remoteIsVideoOff?: boolean;
  durationSeconds?: number;
  onAccept?: () => void;
  onDecline?: () => void;
  onEndCall?: () => void;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onToggleVideo?: () => void;
  onSwitchCamera?: () => void;
}

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
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onSwitchCamera,
}: CallModalProps) {
  const insets = useSafeAreaInsets();
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isSwappedPiP, setIsSwappedPiP] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Pulse animation for avatar ring when ringing
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  // Camera flip rotation animation
  const flipRotation = useSharedValue(0);

  useEffect(() => {
    if (callKind === 'video' && visible && !permission?.granted) {
      requestPermission().catch(() => {});
    }
  }, [callKind, visible, permission?.granted]);

  useEffect(() => {
    if (phase === 'outgoing' || phase === 'incoming') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.24, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 1200 }),
          withTiming(0.7, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
    }
  }, [phase]);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  const animatedFlipStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${flipRotation.value}deg` }],
    };
  });

  const handleFlipCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    flipRotation.value = withTiming(flipRotation.value + 180, { duration: 350 });
    setIsFrontCamera((prev) => !prev);
    onSwitchCamera?.();
  };

  const handleTogglePiPSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSwappedPiP((prev) => !prev);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  if (!visible) return null;

  const isVideoMode = callKind === 'video';
  const isConnected = phase === 'connected';
  const isOutgoing = phase === 'outgoing';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <StatusBar barStyle="light-content" />

        {/* ============================================================ */}
        {/* CASE 1: VIDEO CALL - CONNECTED IN-CALL STATE */}
        {/* ============================================================ */}
        {isVideoMode && isConnected ? (
          <View style={StyleSheet.absoluteFill}>
            {/* Full-bleed Remote Video Stage */}
            <View style={styles.fullScreenVideoContainer}>
              {/* Remote Video Canvas Backdrop */}
              <View style={styles.remoteVideoCanvas}>
                {partnerAvatarUrl ? (
                  <Image source={{ uri: partnerAvatarUrl }} style={styles.remoteVideoBackdropImage} blurRadius={Platform.OS === 'ios' ? 14 : 8} />
                ) : (
                  <View style={styles.remoteVideoPlaceholderBackdrop} />
                )}

                {/* Dark Cinematic Vignette */}
                <View style={styles.videoVignetteOverlay} />

                {/* Center High-Def Video Focus */}
                <View style={styles.centerVideoCard}>
                  {partnerAvatarUrl ? (
                    <Image source={{ uri: partnerAvatarUrl }} style={styles.centerVideoImage} />
                  ) : (
                    <View style={styles.centerVideoPlaceholder}>
                      <Text style={styles.centerVideoInitials}>
                        {(partnerName || 'DH').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {remoteIsVideoOff ? (
                    <View style={styles.cameraPausedBadge}>
                      <Ionicons name="videocam-off" size={12} color="#fbbf24" style={{ marginRight: 5 }} />
                      <Text style={styles.cameraPausedText}>Camera Paused</Text>
                    </View>
                  ) : (
                    <View style={styles.videoQualityBadge}>
                      <View style={styles.liveGreenDot} />
                      <Text style={styles.liveQualityText}>HD 1080p · Live</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Floating Top Header Bar */}
              <View style={[styles.videoHeaderBar, { top: insets.top + 16 }]}>
                <View style={styles.videoHeaderPill}>
                  <Ionicons name="lock-closed" size={12} color="#4ade80" style={{ marginRight: 6 }} />
                  <Text style={styles.videoHeaderName} numberOfLines={1}>
                    {partnerName}
                  </Text>
                  {remoteIsMuted && (
                    <View style={styles.partnerMuteBadge}>
                      <Ionicons name="mic-off" size={12} color="#f87171" style={{ marginRight: 3 }} />
                      <Text style={styles.partnerMuteText}>Muted</Text>
                    </View>
                  )}
                  <View style={styles.headerPillDivider} />
                  <Text style={styles.videoHeaderDuration}>
                    {formatDuration(durationSeconds)}
                  </Text>
                </View>
              </View>

              {/* Picture-in-Picture (PiP) Floating Live Camera Self View */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleTogglePiPSwap}
                style={[styles.pipContainer, { top: insets.top + 70 }]}
              >
                <Animated.View style={[styles.pipInner, animatedFlipStyle]}>
                  {isVideoOff ? (
                    <View style={styles.pipCameraOffBox}>
                      <Ionicons name="videocam-off" size={22} color="#ffffff" />
                      <Text style={styles.pipCameraOffText}>Camera Off</Text>
                    </View>
                  ) : permission?.granted ? (
                    <View style={StyleSheet.absoluteFill}>
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing={isFrontCamera ? 'front' : 'back'}
                      />
                      <View style={styles.pipSelfTag}>
                        <Text style={styles.pipSelfTagText}>You ({isFrontCamera ? 'Front' : 'Back'})</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.pipLiveBox}>
                      <View style={styles.pipLiveMockView}>
                        <Ionicons name="person" size={32} color="#cbd5e1" />
                      </View>
                      <View style={styles.pipSelfTag}>
                        <Text style={styles.pipSelfTagText}>You ({isFrontCamera ? 'Front' : 'Back'})</Text>
                      </View>
                    </View>
                  )}

                  {/* Quick Camera Flip Button inside PiP */}
                  {!isVideoOff && (
                    <TouchableOpacity
                      onPress={handleFlipCamera}
                      style={styles.pipFlipBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="camera-reverse" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </TouchableOpacity>

              {/* Floating Frosted Glass Bottom Controls Dock */}
              <View style={[styles.videoControlsDock, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <View style={styles.videoControlsPill}>
                  {/* Mute Mic */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onToggleMute?.();
                    }}
                    style={[styles.dockBtn, isMuted && styles.dockBtnActive]}
                  >
                    <Ionicons
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={24}
                      color={isMuted ? '#ffffff' : '#f8fafc'}
                    />
                  </TouchableOpacity>

                  {/* Flip Camera */}
                  <TouchableOpacity
                    onPress={handleFlipCamera}
                    style={styles.dockBtn}
                  >
                    <Ionicons name="camera-reverse" size={24} color="#f8fafc" />
                  </TouchableOpacity>

                  {/* Toggle Camera On/Off */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onToggleVideo?.();
                    }}
                    style={[styles.dockBtn, isVideoOff && styles.dockBtnActiveRed]}
                  >
                    <Ionicons
                      name={isVideoOff ? 'videocam-off' : 'videocam'}
                      size={24}
                      color="#ffffff"
                    />
                  </TouchableOpacity>

                  {/* Speaker Toggle */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onToggleSpeaker?.();
                    }}
                    style={[styles.dockBtn, isSpeakerOn && styles.dockBtnActive]}
                  >
                    <Ionicons
                      name={isSpeakerOn ? 'volume-high' : 'volume-medium-outline'}
                      size={24}
                      color={isSpeakerOn ? '#ffffff' : '#f8fafc'}
                    />
                  </TouchableOpacity>

                  {/* End Call */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      onEndCall?.();
                    }}
                    style={[styles.dockBtn, styles.dockBtnEndCall]}
                  >
                    <Ionicons
                      name="call"
                      size={26}
                      color="#ffffff"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : isVideoMode && isOutgoing ? (
          /* ============================================================ */
          /* CASE 2: VIDEO CALL - OUTGOING DIALING STATE WITH LIVE CAMERA */
          /* ============================================================ */
          <View style={StyleSheet.absoluteFill}>
            {/* Live Camera View in background */}
            {!isVideoOff && permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing={isFrontCamera ? 'front' : 'back'}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#090d14' }]} />
            )}

            {/* Subtle Vignette Overlay */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 13, 20, 0.45)' }]} />

            <View style={[styles.contentContainer, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <View style={styles.securityBadge}>
                  <Ionicons name="lock-closed" size={12} color="#4ade80" style={{ marginRight: 5 }} />
                  <Text style={[styles.securityBadgeText, { color: '#ffffff' }]}>End-to-End Encrypted Video Call</Text>
                </View>

                <Text style={styles.partnerNameText} numberOfLines={1}>
                  {partnerName || 'DeltanHub Member'}
                </Text>

                {partnerRole ? (
                  <Text style={styles.partnerRoleText}>{partnerRole}</Text>
                ) : null}

                <Text style={[styles.statusIndicatorText, { color: '#4ade80' }]}>
                  Calling Video...
                </Text>
              </View>

              {/* Center Calling Avatar Stage with Pulse Ring */}
              <View style={styles.avatarSection}>
                <Animated.View style={[styles.pulseRing, animatedRingStyle]} />

                <View style={styles.avatarContainer}>
                  {partnerAvatarUrl ? (
                    <Image source={{ uri: partnerAvatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {(partnerName || 'DH').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.callKindBadge}>
                    <Ionicons name="videocam" size={16} color="#ffffff" />
                  </View>
                </View>
              </View>

              {/* Bottom Calling Controls */}
              <View style={styles.controlsSection}>
                <View style={styles.inCallControlsContainer}>
                  <View style={styles.togglesRow}>
                    {/* Mute Mic */}
                    <View style={styles.actionCol}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onToggleMute?.();
                        }}
                        style={[styles.smallCircleBtn, isMuted && styles.activeToggleBtn]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isMuted ? 'mic-off' : 'mic'}
                          size={24}
                          color={isMuted ? '#4A0F1F' : '#e2e8f0'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.actionBtnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                    </View>

                    {/* Flip Camera */}
                    <View style={styles.actionCol}>
                      <TouchableOpacity
                        onPress={handleFlipCamera}
                        style={styles.smallCircleBtn}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="camera-reverse" size={24} color="#e2e8f0" />
                      </TouchableOpacity>
                      <Text style={styles.actionBtnLabel}>Flip</Text>
                    </View>

                    {/* Toggle Video */}
                    <View style={styles.actionCol}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onToggleVideo?.();
                        }}
                        style={[styles.smallCircleBtn, isVideoOff && styles.activeToggleBtn]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isVideoOff ? 'videocam-off' : 'videocam'}
                          size={24}
                          color={isVideoOff ? '#4A0F1F' : '#e2e8f0'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.actionBtnLabel}>{isVideoOff ? 'Camera Off' : 'Camera'}</Text>
                    </View>
                  </View>

                  {/* End Call Button */}
                  <View style={[styles.actionCol, { marginTop: 24 }]}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        onEndCall?.();
                      }}
                      style={[styles.circleBtn, styles.endCallBtn]}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="call"
                        size={32}
                        color="#ffffff"
                        style={{ transform: [{ rotate: '135deg' }] }}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.actionBtnLabel, { color: '#f87171' }]}>End Call</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ============================================================ */
          /* CASE 3: AUDIO CALL (OR INCOMING AUDIO/VIDEO CALL MODAL) */
          /* ============================================================ */
          <View style={StyleSheet.absoluteFill}>
            <SafeBlurView
              intensity={90}
              tint="dark"
              fallbackBackgroundColor="rgba(10, 15, 26, 0.96)"
              style={StyleSheet.absoluteFill}
            />

            {/* Ambient Dark Wine Glow Effect */}
            <View style={styles.ambientGlow} />

            <View style={[styles.contentContainer, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <View style={styles.securityBadge}>
                  <Ionicons name="lock-closed" size={12} color="#94a3b8" style={{ marginRight: 5 }} />
                  <Text style={styles.securityBadgeText}>End-to-End Encrypted {isVideoMode ? 'Video' : 'Audio'} Call</Text>
                </View>

                <Text style={styles.partnerNameText} numberOfLines={1}>
                  {partnerName || 'DeltanHub Member'}
                </Text>

                {partnerRole ? (
                  <Text style={styles.partnerRoleText}>{partnerRole}</Text>
                ) : null}

                {/* Status / Duration indicator */}
                <Text style={styles.statusIndicatorText}>
                  {phase === 'outgoing' && 'Calling...'}
                  {phase === 'incoming' && `Incoming ${isVideoMode ? 'Video' : 'Audio'} Call...`}
                  {phase === 'connected' && formatDuration(durationSeconds)}
                  {phase === 'ended' && `Call Ended (${formatDuration(durationSeconds)})`}
                </Text>

                {phase === 'connected' && remoteIsMuted && (
                  <View style={styles.audioPartnerMutePill}>
                    <Ionicons name="mic-off" size={13} color="#f87171" style={{ marginRight: 5 }} />
                    <Text style={styles.audioPartnerMuteText}>Partner muted microphone</Text>
                  </View>
                )}
              </View>

              {/* Center Avatar Section */}
              <View style={styles.avatarSection}>
                {(phase === 'outgoing' || phase === 'incoming') && (
                  <Animated.View style={[styles.pulseRing, animatedRingStyle]} />
                )}

                <View style={styles.avatarContainer}>
                  {partnerAvatarUrl ? (
                    <Image source={{ uri: partnerAvatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {(partnerName || 'DH').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Call Kind Floating Badge */}
                  <View style={styles.callKindBadge}>
                    <Ionicons
                      name={isVideoMode ? 'videocam' : 'call'}
                      size={16}
                      color="#ffffff"
                    />
                  </View>
                </View>
              </View>

              {/* Bottom Action Controls */}
              <View style={styles.controlsSection}>
                {phase === 'incoming' ? (
                  /* Incoming Actions: Decline & Accept */
                  <View style={styles.incomingActionsRow}>
                    <View style={styles.actionCol}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                          onDecline?.();
                        }}
                        style={[styles.circleBtn, styles.declineBtn]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={34} color="#ffffff" />
                      </TouchableOpacity>
                      <Text style={styles.actionBtnLabel}>Decline</Text>
                    </View>

                    <View style={styles.actionCol}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          onAccept?.();
                        }}
                        style={[styles.circleBtn, styles.acceptBtn]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={isVideoMode ? 'videocam' : 'call'} size={32} color="#ffffff" />
                      </TouchableOpacity>
                      <Text style={styles.actionBtnLabel}>Accept</Text>
                    </View>
                  </View>
                ) : (
                  /* Outgoing / Active Audio In-Call Controls */
                  <View style={styles.inCallControlsContainer}>
                    {/* Secondary Toggles Grid */}
                    <View style={styles.togglesRow}>
                      {/* Mute Mic */}
                      <View style={styles.actionCol}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onToggleMute?.();
                          }}
                          style={[styles.smallCircleBtn, isMuted && styles.activeToggleBtn]}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isMuted ? 'mic-off' : 'mic'}
                            size={24}
                            color={isMuted ? '#4A0F1F' : '#e2e8f0'}
                          />
                        </TouchableOpacity>
                        <Text style={styles.actionBtnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                      </View>

                      {/* Speaker Toggle */}
                      <View style={styles.actionCol}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onToggleSpeaker?.();
                          }}
                          style={[styles.smallCircleBtn, isSpeakerOn && styles.activeToggleBtn]}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isSpeakerOn ? 'volume-high' : 'volume-medium-outline'}
                            size={24}
                            color={isSpeakerOn ? '#4A0F1F' : '#e2e8f0'}
                          />
                        </TouchableOpacity>
                        <Text style={styles.actionBtnLabel}>Speaker</Text>
                      </View>

                      {/* Video Toggle */}
                      <View style={styles.actionCol}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onToggleVideo?.();
                          }}
                          style={[styles.smallCircleBtn, isVideoOff && styles.activeToggleBtn]}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isVideoOff ? 'videocam-off' : 'videocam'}
                            size={24}
                            color={isVideoOff ? '#4A0F1F' : '#e2e8f0'}
                          />
                        </TouchableOpacity>
                        <Text style={styles.actionBtnLabel}>{isVideoMode ? 'Camera' : 'Video'}</Text>
                      </View>
                    </View>

                    {/* Primary End Call Button */}
                    <View style={[styles.actionCol, { marginTop: 24 }]}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                          onEndCall?.();
                        }}
                        style={[styles.circleBtn, styles.endCallBtn]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="call"
                          size={32}
                          color="#ffffff"
                          style={{ transform: [{ rotate: '135deg' }] }}
                        />
                      </TouchableOpacity>
                      <Text style={[styles.actionBtnLabel, { color: '#f87171' }]}>End Call</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 20, 0.98)',
  },
  ambientGlow: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(74, 15, 31, 0.35)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    width: '100%',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  securityBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    fontFamily: Typography.fontFamily,
  },
  partnerNameText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
  },
  partnerRoleText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
    fontFamily: Typography.fontFamily,
  },
  statusIndicatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a1a1aa',
    fontFamily: Typography.fontFamily,
  },
  avatarSection: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: '#4A0F1F',
    backgroundColor: 'rgba(74, 15, 31, 0.25)',
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: '#4A0F1F',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    backgroundColor: '#380b18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 38,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  callKindBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A0F1F',
    borderWidth: 2,
    borderColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsSection: {
    width: '100%',
    alignItems: 'center',
  },
  incomingActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 280,
  },
  inCallControlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  togglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    maxWidth: 320,
  },
  actionCol: {
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  smallCircleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToggleBtn: {
    backgroundColor: '#ffffff',
  },
  acceptBtn: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  declineBtn: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  endCallBtn: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    fontFamily: Typography.fontFamily,
  },

  // --- FULL-SCREEN VIDEO CALL STYLES ---
  fullScreenVideoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideoCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090D14',
    position: 'relative',
  },
  remoteVideoBackdropImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  remoteVideoPlaceholderBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d1522',
  },
  videoVignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  centerVideoCard: {
    alignItems: 'center',
    gap: 16,
  },
  centerVideoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  centerVideoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4A0F1F',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerVideoInitials: {
    fontSize: 44,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  videoQualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveQualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
    fontFamily: Typography.fontFamily,
  },
  videoHeaderBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 20,
  },
  videoHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  videoHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    maxWidth: 160,
    fontFamily: Typography.fontFamily,
  },
  headerPillDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  videoHeaderDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    fontFamily: Typography.fontFamily,
  },
  pipContainer: {
    position: 'absolute',
    right: 18,
    width: 110,
    height: 158,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 30,
    backgroundColor: '#18202f',
  },
  pipInner: {
    flex: 1,
  },
  pipLiveBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipLiveMockView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipSelfTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  pipSelfTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  pipCameraOffBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  pipCameraOffText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    fontFamily: Typography.fontFamily,
  },
  pipFlipBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  videoControlsDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  videoControlsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  dockBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockBtnActive: {
    backgroundColor: '#ffffff',
  },
  dockBtnActiveRed: {
    backgroundColor: '#ef4444',
  },
  dockBtnEndCall: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  partnerMuteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  partnerMuteText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  cameraPausedBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  cameraPausedText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  audioPartnerMutePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  audioPartnerMuteText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
});
