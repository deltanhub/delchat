import { useState, useEffect, useCallback } from 'react';
import {
  isPinRequiredOnDevice,
  setPinRequiredOnDevice as setPinRequiredStorage,
  isBiometricsEnabled,
  setBiometricsEnabled as setBiometricsStorage,
  checkBiometricsAvailable,
  getSavedChatPin,
  verifyChatPin,
} from '../../../lib/chat-security-service';

export async function tryAutoUnlockWithSavedPin(): Promise<boolean> {
  const required = await isPinRequiredOnDevice();
  const savedPin = await getSavedChatPin();
  if (!required && savedPin) {
    const autoRes = await verifyChatPin(savedPin);
    return autoRes.ok;
  }
  return false;
}

export function useChatPinPreferences() {
  const [pinRequiredOnDevice, setPinRequiredOnDeviceState] = useState(true);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(true);
  const [biometryType, setBiometryType] = useState<'FaceID' | 'TouchID' | 'Biometrics' | null>(null);

  useEffect(() => {
    isPinRequiredOnDevice().then(setPinRequiredOnDeviceState);
    isBiometricsEnabled().then(setBiometricsEnabledState);
    checkBiometricsAvailable().then((b) => setBiometryType(b.biometryType));
  }, []);

  const setPinRequiredOnDevice = useCallback(async (required: boolean) => {
    await setPinRequiredStorage(required);
    setPinRequiredOnDeviceState(required);
  }, []);

  const setBiometricsEnabled = useCallback(async (enabled: boolean) => {
    await setBiometricsStorage(enabled);
    setBiometricsEnabledState(enabled);
  }, []);

  return {
    pinRequiredOnDevice,
    biometricsEnabled,
    biometryType,
    setPinRequiredOnDevice,
    setBiometricsEnabled,
  };
}
