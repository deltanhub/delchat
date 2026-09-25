import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useCallback } from 'react';

export function useIncomingCallAnimation(onDismissComplete: () => void) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const ringScale = useSharedValue(1);

  const startEnterAnimation = useCallback(() => {
    translateY.value = -80;
    opacity.value = 0;
    translateY.value = withSpring(0, { mass: 1, stiffness: 100, damping: 15 });
    opacity.value = withTiming(1, { duration: 220 });
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
  }, [translateY, opacity, ringScale]);

  const startExitAnimation = useCallback(() => {
    translateY.value = withTiming(-200, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onDismissComplete)();
    });
    opacity.value = withTiming(0, { duration: 200 });
  }, [translateY, opacity, onDismissComplete]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return {
    startEnterAnimation,
    startExitAnimation,
    animatedContainerStyle,
    animatedRingStyle,
  };
}
