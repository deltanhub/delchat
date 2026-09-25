export type { ChatAccessStatus } from './chat_security';

export {
  // Token & Gate Session
  getStoredChatGateToken,
  getCachedChatGateTokenSync,
  saveChatGateSession,
  clearChatGateSession,

  // Remote Verification & Lifecycle
  fetchChatAccessStatus,
  verifyChatPin,
  setupChatPin,
  lockChatRemote,

  // Device PIN Storage
  getSavedChatPin,
  saveChatPinLocal,
  clearSavedChatPinLocal,

  // Device Preferences
  isPinRequiredOnDevice,
  setPinRequiredOnDevice,
  isBiometricsEnabled,
  setBiometricsEnabled,

  // Biometrics
  checkBiometricsAvailable,
  authenticateWithBiometrics,
} from './chat_security';
