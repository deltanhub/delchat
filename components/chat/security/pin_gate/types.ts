import { Animated } from 'react-native';

export interface ChatPinGateModalProps {
  visible: boolean;
  pinLength?: number;
  isSetupRequired?: boolean;
  onUnlocked: () => void;
  onCancel?: () => void;
}

export type SetupStep = 'create' | 'confirm';

export interface BiometryInfo {
  available: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Biometrics' | null;
}

export interface PinGateHeaderProps {
  isSetupRequired: boolean;
  setupStep: SetupStep;
  textColor: string;
  placeholderColor: string;
  isDark: boolean;
  onCancel?: () => void;
}

export interface PinDotsRowProps {
  targetLength: number;
  pinLength: number;
  shakeAnim: Animated.Value;
  isDark: boolean;
}

export interface PinKeypadGridProps {
  biometryInfo: BiometryInfo;
  hasSavedPin: boolean;
  isSetupRequired: boolean;
  isDark: boolean;
  colors: {
    text: string;
  };
  onBiometricUnlock: () => void;
  onKeyPress: (digit: string) => void;
  onDelete: () => void;
}
