import { useState, useCallback } from 'react';
import * as Haptics from '../../../../lib/haptics';
import {
  authenticateWithBiometrics,
  checkBiometricsAvailable,
  getSavedChatPin,
  isBiometricsEnabled,
} from '../../../../lib/chat-security-service';
import { BiometryInfo } from './types';

export function usePinGateBiometrics(
  onUnlocked: () => void,
  setErrorMsg: (msg: string | null) => void,
  setVerifying: (v: boolean) => void,
  verifying: boolean
) {
  const [biometryInfo, setBiometryInfo] = useState<BiometryInfo>({ available: false, biometryType: null });
  const [hasSavedPin, setHasSavedPin] = useState(false);

  const handleBiometricUnlock = useCallback(async () => {
    if (verifying) return;
    setVerifying(true);
    setErrorMsg(null);
    const res = await authenticateWithBiometrics();
    setVerifying(false);

    if (res.ok) {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
      onUnlocked();
    } else if (res.error && res.error !== 'Biometric authentication cancelled.') {
      setErrorMsg(res.error);
    }
  }, [verifying, onUnlocked, setErrorMsg, setVerifying]);

  const checkBiometricsOnMount = useCallback((isSetupRequired: boolean) => {
    checkBiometricsAvailable().then(setBiometryInfo);
    getSavedChatPin().then((saved) => {
      const exists = Boolean(saved);
      setHasSavedPin(exists);
      if (exists && !isSetupRequired) {
        isBiometricsEnabled().then((enabled) => {
          if (enabled) handleBiometricUnlock();
        });
      }
    });
  }, [handleBiometricUnlock]);

  return {
    biometryInfo,
    hasSavedPin,
    handleBiometricUnlock,
    checkBiometricsOnMount,
  };
}
