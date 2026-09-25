import * as LocalAuthentication from 'expo-local-authentication';
import { getSavedChatPin } from './devicePreferences';
import { verifyChatPin } from './pinOperations';

export async function checkBiometricsAvailable(): Promise<{
  available: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Biometrics' | null;
}> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return { available: false, biometryType: null };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let biometryType: 'FaceID' | 'TouchID' | 'Biometrics' = 'Biometrics';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'FaceID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'TouchID';
    }

    return { available: true, biometryType };
  } catch {
    return { available: false, biometryType: null };
  }
}

export async function authenticateWithBiometrics(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { available, biometryType } = await checkBiometricsAvailable();
    if (!available) {
      return { ok: false, error: 'Biometrics not available or not enrolled.' };
    }

    const savedPin = await getSavedChatPin();
    if (!savedPin) {
      return { ok: false, error: 'Please enter your PIN manually first to enable biometric unlock.' };
    }

    const promptMessage =
      biometryType === 'FaceID'
        ? 'Unlock DelChat with Face ID'
        : biometryType === 'TouchID'
        ? 'Unlock DelChat with Touch ID'
        : 'Unlock DelChat with Biometrics';

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Enter PIN',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return { ok: false, error: 'Biometric authentication cancelled.' };
    }

    return await verifyChatPin(savedPin);
  } catch (err: any) {
    return { ok: false, error: err.message || 'Biometric authentication error.' };
  }
}
