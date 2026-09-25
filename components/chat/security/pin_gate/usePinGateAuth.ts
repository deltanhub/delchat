import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from '../../../../lib/haptics';
import { verifyChatPin, setupChatPin, authenticateWithBiometrics } from '../../../../lib/chat-security-service';
import { SetupStep } from './types';
import { usePinGateBiometrics } from './usePinGateBiometrics';

interface UsePinGateAuthParams {
  visible: boolean;
  pinLength: number;
  isSetupRequired: boolean;
  onUnlocked: () => void;
}

export function usePinGateAuth({
  visible,
  pinLength,
  isSetupRequired,
  onUnlocked,
}: UsePinGateAuthParams) {
  const [pin, setPin] = useState('');
  const [setupStep, setSetupStep] = useState<SetupStep>('create');
  const [initialPin, setInitialPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const targetLength = pinLength === 6 ? 6 : 4;

  const { biometryInfo, hasSavedPin, handleBiometricUnlock, checkBiometricsOnMount } =
    usePinGateBiometrics(onUnlocked, setErrorMsg, setVerifying, verifying);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (visible) {
      setPin('');
      setInitialPin('');
      setSetupStep('create');
      setErrorMsg(null);
      setVerifying(false);
      checkBiometricsOnMount(isSetupRequired);
    }
  }, [visible, isSetupRequired, checkBiometricsOnMount]);

  const handleSetupStep = async (enteredPin: string) => {
    if (setupStep === 'create') {
      setInitialPin(enteredPin);
      setPin('');
      setSetupStep('confirm');
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    } else {
      if (enteredPin !== initialPin) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
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
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
        setPin('');
        onUnlocked();
      } else {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
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
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
      setPin('');
      onUnlocked();
    } else {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
      triggerShake();
      setErrorMsg(res.error || 'Incorrect chat PIN. Please try again.');
      setPin('');
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length >= targetLength || verifying) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    setErrorMsg(null);
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === targetLength) {
      if (isSetupRequired) handleSetupStep(nextPin);
      else submitUnlock(nextPin);
    }
  };

  const handleDelete = () => {
    if (pin.length === 0 || verifying) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    setPin((p) => p.slice(0, -1));
    setErrorMsg(null);
  };

  return {
    pin, targetLength, setupStep, verifying, errorMsg,
    biometryInfo, hasSavedPin, shakeAnim, handleBiometricUnlock,
    handleKeyPress, handleDelete, authenticateWithBiometrics,
  };
}
