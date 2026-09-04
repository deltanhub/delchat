import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { Typography } from '../constants/Typography';
import ScalePressable from './ScalePressable';
import { Ionicons } from '@expo/vector-icons';

interface AppLockOverlayProps {
  onUnlock: () => void;
  isAuthenticating: boolean;
}

export default function AppLockOverlay({ onUnlock, isAuthenticating }: AppLockOverlayProps) {
  const insets = useSafeAreaInsets();
  // We use dark theme styles specifically for the premium secure cinema/glass overlay
  const colors = Colors.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.iconContainer}>
          <View style={styles.glassCircle}>
            <Ionicons name="lock-closed" size={48} color="#ffffff" />
          </View>
        </View>

        <Text style={styles.title}>DelChat is Locked</Text>
        <Text style={styles.subtitle}>
          Use Face ID / Touch ID or your device passcode to access your secure conversations.
        </Text>

        <View style={styles.buttonContainer}>
          <ScalePressable
            onPress={onUnlock}
            disabled={isAuthenticating}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>
              {isAuthenticating ? 'Authenticating...' : 'Unlock App'}
            </Text>
          </ScalePressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999, // Ensure it covers everything
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: Typography.lineHeights.md,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxHeight: 120,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 240,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a0f1f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontFamily: Typography.fontFamily,
    color: '#ffffff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
