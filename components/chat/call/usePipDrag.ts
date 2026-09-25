import { useRef } from 'react';
import { PanResponder, Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from '../../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function usePipDrag(onFlipCamera: () => void) {
  const pipTranslateX = useSharedValue(0);
  const pipTranslateY = useSharedValue(0);
  const flipRotation = useSharedValue(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onPanResponderMove: (_, gestureState) => {
        pipTranslateX.value = gestureState.dx;
        pipTranslateY.value = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        const snapX = gestureState.moveX < SCREEN_WIDTH / 2 ? -(SCREEN_WIDTH - 110 - 36) : 0;
        pipTranslateX.value = withSpring(snapX, { mass: 1, stiffness: 100, damping: 15 });
        pipTranslateY.value = withSpring(gestureState.dy, { mass: 1, stiffness: 100, damping: 15 });
      },
    })
  ).current;

  const animatedPipPositionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pipTranslateX.value }, { translateY: pipTranslateY.value }],
  }));

  const animatedFlipStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value}deg` }],
  }));

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    flipRotation.value = withTiming(flipRotation.value + 180, { duration: 350 });
    onFlipCamera();
  };

  return {
    panResponder,
    animatedPipPositionStyle,
    animatedFlipStyle,
    handleFlip,
  };
}
