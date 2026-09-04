import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppHaptics } from '../lib/haptics';
import Colors from '../constants/Colors';
import { Typography } from '../constants/Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Spring configuration matching Apple standards from AGENTS.md
const iOSSpringConfig = {
  mass: 1,
  stiffness: 100,
  damping: 15,
};

interface AppleButtonProps {
  onPress?: () => void;
  text?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AppleButton: React.FC<AppleButtonProps> = ({
  onPress,
  text,
  style,
  textStyle,
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.97, iOSSpringConfig);
    AppHaptics.impactAsync(AppHaptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1.0, iOSSpringConfig);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
        };
      case 'outline':
        return {
          button: styles.outlineButton,
          text: styles.outlineText,
        };
      case 'primary':
      default:
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        variantStyles.button,
        style,
        (disabled || loading) && styles.disabledButton,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.light.primary : '#ffffff'} />
      ) : children ? (
        children
      ) : (
        <Text style={[variantStyles.text, textStyle]}>{text}</Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamily,
  },
  secondaryButton: {
    backgroundColor: Colors.light.primarySoft,
  },
  secondaryText: {
    color: Colors.light.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamily,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  outlineText: {
    color: Colors.light.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamily,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AppleButton;
