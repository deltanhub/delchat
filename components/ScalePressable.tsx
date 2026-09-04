import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SPRING_CONFIG = {
  mass: 1,
  stiffness: 100,
  damping: 15,
};

interface ScalePressableProps extends PressableProps {
  children: React.ReactNode;
  style?: any;
  containerStyle?: any;
}

export const ScalePressable = ({ children, style, containerStyle, onPressIn, onPressOut, ...props }: ScalePressableProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const flexStyle = React.useMemo(() => {
    if (!style) return undefined;
    if (Array.isArray(style)) {
      const flexObj = style.find(s => s && (s.flex !== undefined || s.flexGrow !== undefined));
      return flexObj ? { flex: flexObj.flex, flexGrow: flexObj.flexGrow } : undefined;
    }
    return (style.flex !== undefined || style.flexGrow !== undefined) ? { flex: style.flex, flexGrow: style.flexGrow } : undefined;
  }, [style]);

  const handlePressIn = (event: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics fallback for environments where not supported
    }
    scale.value = withSpring(0.97, SPRING_CONFIG);
    if (onPressIn) onPressIn(event);
  };

  const handlePressOut = (event: any) => {
    scale.value = withSpring(1, SPRING_CONFIG);
    if (onPressOut) onPressOut(event);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, flexStyle]}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
export default ScalePressable;
