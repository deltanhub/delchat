import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import * as Haptics from '../../../lib/haptics';
import {
  verifyChatPin,
  setupChatPin,
  authenticateWithBiometrics,
  checkBiometricsAvailable,
  getSavedChatPin,
  isBiometricsEnabled,
} from '../../../lib/chat-security-service';

interface ChatPinGateModalProps {
  visible: boolean;
  pinLength?: number;
  isSetupRequired?: boolean;
  onUnlocked: () => void;
  onCancel?: () => void;
}

export default function ChatPinGateModal({
  visible,
  pinLength = 4,
  isSetupRequired = false,
  onUnlocked,
  onCancel,
}: ChatPinGateModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [pin, setPin] = useState('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [initialPin, setInitialPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [biometryInfo, setBiometryInfo] = useState<{
    available: boolean;
    biometryType: 'FaceID' | 'TouchID' | 'Biometrics' | null;
  }>({ available: false, biometryType: null });
  const [hasSavedPin, setHasSavedPin] = useState(false);

  // Shake animation on wrong PIN entry
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const targetLength = pinLength === 6 ? 6 : 4;

  const handleBiometricUnlock = async () => {
    if (verifying) return;
    setVerifying(true);
    setErrorMsg(null);
    const res = await authenticateWithBiometrics();
    setVerifying(false);

    if (res.ok) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      onUnlocked();
    } else if (res.error && res.error !== 'Biometric authentication cancelled.') {
      setErrorMsg(res.error);
    }
  };

  useEffect(() => {
    if (visible) {
      setPin('');
      setInitialPin('');
      setSetupStep('create');
      setErrorMsg(null);
      setVerifying(false);

      // Check for available biometrics and saved PIN
      checkBiometricsAvailable().then(setBiometryInfo);
      getSavedChatPin().then((saved) => {
        const exists = Boolean(saved);
        setHasSavedPin(exists);
        if (exists && !isSetupRequired) {
          isBiometricsEnabled().then((enabled) => {
            if (enabled) {
              handleBiometricUnlock();
            }
          });
        }
      });
    }
  }, [visible, isSetupRequired]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length >= targetLength || verifying) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    setErrorMsg(null);
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === targetLength) {
      if (isSetupRequired) {
        handleSetupStep(nextPin);
      } else {
        submitUnlock(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length === 0 || verifying) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setPin((p) => p.slice(0, -1));
    setErrorMsg(null);
  };

  const handleSetupStep = async (enteredPin: string) => {
    if (setupStep === 'create') {
      setInitialPin(enteredPin);
      setPin('');
      setSetupStep('confirm');
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    } else {
      if (enteredPin !== initialPin) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        triggerShake();
        setErrorMsg('PINs do not match. Please try again.');
        setPin('');
        setSetupStep('create');
        setInitialPin('');
        return;
      }

      setVerifying(true);
      setErrorMsg(null);
      const res = await setupChatPin(initialPin, enteredPin);
      setVerifying(false);

      if (res.ok) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        setPin('');
        onUnlocked();
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        triggerShake();
        setErrorMsg(res.error || 'Failed to set up PIN.');
        setPin('');
        setSetupStep('create');
        setInitialPin('');
      }
    }
  };

  const submitUnlock = async (enteredPin: string) => {
    setVerifying(true);
    setErrorMsg(null);

    const res = await verifyChatPin(enteredPin);
    setVerifying(false);

    if (res.ok) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      setPin('');
      onUnlocked();
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      triggerShake();
      setErrorMsg(res.error || 'Incorrect chat PIN. Please try again.');
      setPin('');
    }
  };

  if (!visible) return null;

  const dots = Array.from({ length: targetLength }, (_, i) => i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? '#000000' : '#f4f7fb',
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Top Dismiss Button (if cancellable) */}
        {onCancel && (
          <View style={styles.headerBar}>
            <ScalePressable onPress={onCancel} style={styles.dismissBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </ScalePressable>
          </View>
        )}

        <View style={styles.centerContainer}>
          {/* Wine Brand Shield Header */}
          <View
            style={[
              styles.shieldBox,
              {
                backgroundColor: isDark ? 'rgba(74, 15, 31, 0.35)' : '#f4e7eb',
                borderColor: isDark ? '#4a0f1f' : '#e0cad0',
              },
            ]}
          >
            <Ionicons name="lock-closed" size={32} color="#4a0f1f" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {isSetupRequired
              ? setupStep === 'create'
                ? 'Create Chat PIN'
                : 'Confirm Chat PIN'
              : 'Chat Security Gate'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.placeholder }]}>
            {isSetupRequired
              ? setupStep === 'create'
                ? 'Create a 4-digit PIN to secure your encrypted messages.'
                : 'Re-enter your 4-digit PIN to confirm.'
              : 'Enter your DeltanHub PIN to unlock private encrypted conversations.'}
          </Text>

          {/* Dynamic PIN Indicator Dots */}
          <Animated.View
            style={[
              styles.dotsRow,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {dots.map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isFilled ? '#4a0f1f' : 'transparent',
                      borderColor: isFilled
                        ? '#4a0f1f'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.25)'
                        : '#cbd5e1',
                    },
                  ]}
                />
              );
            })}
          </Animated.View>

          {/* Error Message */}
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <View style={{ height: 20 }} />
          )}

          {/* Verifying Indicator */}
          {verifying && (
            <ActivityIndicator
              size="small"
              color="#4a0f1f"
              style={{ marginVertical: 6 }}
            />
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <ScalePressable
                key={digit}
                onPress={() => handleKeyPress(digit)}
                style={[
                  styles.key,
                  {
                    backgroundColor: isDark ? '#141416' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                  },
                ]}
              >
                <Text style={[styles.keyDigit, { color: colors.text }]}>{digit}</Text>
              </ScalePressable>
            ))}

            {/* Biometric or Empty Spacer */}
            {biometryInfo.available && hasSavedPin && !isSetupRequired ? (
              <ScalePressable
                onPress={handleBiometricUnlock}
                style={[
                  styles.keyAction,
                  {
                    backgroundColor: isDark ? '#141416' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                  },
                ]}
              >
                <Ionicons
                  name={biometryInfo.biometryType === 'FaceID' ? 'scan-outline' : 'finger-print-outline'}
                  size={26}
                  color="#4a0f1f"
                />
              </ScalePressable>
            ) : (
              <View style={styles.keyEmpty} />
            )}

            {/* Zero Key */}
            <ScalePressable
              onPress={() => handleKeyPress('0')}
              style={[
                styles.key,
                {
                  backgroundColor: isDark ? '#141416' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                },
              ]}
            >
              <Text style={[styles.keyDigit, { color: colors.text }]}>0</Text>
            </ScalePressable>

            {/* Backspace Key */}
            <ScalePressable
              onPress={handleDelete}
              style={[
                styles.keyAction,
                {
                  backgroundColor: isDark ? '#141416' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                },
              ]}
            >
              <Ionicons name="backspace-outline" size={26} color={colors.text} />
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 40,
  },
  dismissBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shieldBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 16,
    fontFamily: Typography.fontFamily,
    lineHeight: 20,
    marginBottom: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
  },
  keypad: {
    width: '85%',
    maxWidth: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    rowGap: 16,
  },
  key: {
    width: '30%',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  keyDigit: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  keyEmpty: {
    width: '30%',
    height: 64,
  },
  keyAction: {
    width: '30%',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});
