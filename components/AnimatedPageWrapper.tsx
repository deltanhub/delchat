import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const SPRING_CONFIG = {
  mass: 1,
  stiffness: 100,
  damping: 15,
};

export const AnimatedPageWrapper = ({ children }: { children: React.ReactNode }) => {
  const isAndroid = Platform.OS === 'android';
  const opacity = useSharedValue(isAndroid ? 1 : 0);
  const translateY = useSharedValue(isAndroid ? 0 : 15);

  useEffect(() => {
    if (!isAndroid) {
      opacity.value = withSpring(1, SPRING_CONFIG);
      translateY.value = withSpring(0, SPRING_CONFIG);
    }
  }, [isAndroid]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};
export default AnimatedPageWrapper;
