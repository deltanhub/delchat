import React from 'react';
import { StyleSheet, View, Platform, ViewProps } from 'react-native';

export interface SafeBlurViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  fallbackBackgroundColor?: string;
  children?: React.ReactNode;
}

let NativeBlurView: any = null;
try {
  // Dynamically require expo-blur so bundlers / runtimes without native module link never break
  const expoBlur = require('expo-blur');
  NativeBlurView = expoBlur.BlurView || expoBlur.default || expoBlur;
} catch (e) {
  NativeBlurView = null;
}

export default function SafeBlurView({
  intensity = 70,
  tint = 'dark',
  style,
  children,
  fallbackBackgroundColor = 'rgba(15, 18, 24, 0.85)',
  ...rest
}: SafeBlurViewProps) {
  if (NativeBlurView && Platform.OS === 'ios') {
    try {
      return (
        <NativeBlurView
          intensity={intensity}
          tint={tint}
          style={style}
          {...rest}
        >
          {children}
        </NativeBlurView>
      );
    } catch (err) {
      // Fallback if iOS native blur fails
    }
  }

  // Sleek frosted glass fallback for Android, Web, or non-native environments
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: fallbackBackgroundColor },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
