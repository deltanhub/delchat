import React, { useEffect } from 'react';
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
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    opacity.value = withSpring(1, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
  }, []);

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
