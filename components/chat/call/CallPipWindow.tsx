import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from '../../../lib/haptics';
import { pipStyles as styles } from './pipStyles';
import { usePipDrag } from './usePipDrag';
import { SafeRTCView } from './SafeRTCView';

export interface CallPipWindowProps {
  topInset: number;
  isVideoOff: boolean;
  isFrontCamera: boolean;
  onFlipCamera: () => void;
  onTogglePiPSwap?: () => void;
  localStream?: any;
}

export const CallPipWindow: React.FC<CallPipWindowProps> = ({
  topInset,
  isVideoOff,
  isFrontCamera,
  onFlipCamera,
  onTogglePiPSwap,
  localStream,
}) => {
  const [permission] = useCameraPermissions();
  const {
    panResponder,
    animatedPipPositionStyle,
    animatedFlipStyle,
    handleFlip,
  } = usePipDrag(onFlipCamera);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.pipContainer, { top: topInset + 70 }, animatedPipPositionStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTogglePiPSwap?.();
        }}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[styles.pipInner, animatedFlipStyle]}>
          {isVideoOff ? (
            <View style={styles.pipCameraOffBox}>
              <Ionicons name="videocam-off" size={22} color="#ffffff" />
              <Text style={styles.pipCameraOffText}>Camera Off</Text>
            </View>
          ) : localStream ? (
            <View style={StyleSheet.absoluteFill}>
              <SafeRTCView
                stream={localStream}
                mirror={isFrontCamera}
                style={StyleSheet.absoluteFill}
                objectFit="cover"
                zOrder={1}
              />
              <View style={styles.pipSelfTag}>
                <Text style={styles.pipSelfTagText}>
                  You ({isFrontCamera ? 'Front' : 'Back'})
                </Text>
              </View>
            </View>
          ) : permission?.granted ? (
            <View style={StyleSheet.absoluteFill}>
              <CameraView style={StyleSheet.absoluteFill} facing={isFrontCamera ? 'front' : 'back'} />
              <View style={styles.pipSelfTag}>
                <Text style={styles.pipSelfTagText}>
                  You ({isFrontCamera ? 'Front' : 'Back'})
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.pipLiveBox}>
              <View style={styles.pipLiveMockView}>
                <Ionicons name="person" size={32} color="#cbd5e1" />
              </View>
              <View style={styles.pipSelfTag}>
                <Text style={styles.pipSelfTagText}>
                  You ({isFrontCamera ? 'Front' : 'Back'})
                </Text>
              </View>
            </View>
          )}

          {!isVideoOff && (
            <TouchableOpacity
              onPress={handleFlip}
              style={styles.pipFlipBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="camera-reverse" size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};
