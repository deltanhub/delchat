import { ChatAccessStatus } from '../../../lib/chat-security-service';

export interface ChatPinGateContextType {
  isChatUnlocked: boolean;
  pinLength: number;
  isSetupRequired: boolean;
  pinRequiredOnDevice: boolean;
  biometricsEnabled: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Biometrics' | null;
  setPinRequiredOnDevice: (required: boolean) => Promise<void>;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  promptUnlock: (force?: boolean) => Promise<boolean>;
  checkChatAccess: () => Promise<ChatAccessStatus | null>;
  lockChat: () => Promise<void>;
}
