import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  fetchChatAccessStatus,
  getStoredChatGateToken,
  clearChatGateSession,
  lockChatRemote,
  getSavedChatPin,
  isPinRequiredOnDevice,
  setPinRequiredOnDevice as setPinRequiredStorage,
  isBiometricsEnabled,
  setBiometricsEnabled as setBiometricsStorage,
  checkBiometricsAvailable,
  verifyChatPin,
  ChatAccessStatus,
} from '../../../lib/chat-security-service';
import { registerChatPinChallengeHandler } from '../../../lib/api-client';
import ChatPinGateModal from './ChatPinGateModal';

interface ChatPinGateContextType {
  isChatUnlocked: boolean;
  pinLength: number;
  isSetupRequired: boolean;
  pinRequiredOnDevice: boolean;
  biometricsEnabled: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Biometrics' | null;
  setPinRequiredOnDevice: (required: boolean) => Promise<void>;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  promptUnlock: () => Promise<boolean>;
  checkChatAccess: () => Promise<ChatAccessStatus | null>;
  lockChat: () => Promise<void>;
}

const ChatPinGateContext = createContext<ChatPinGateContextType | undefined>(undefined);

export function ChatPinGateProvider({ children }: { children: React.ReactNode }) {
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [pinLength, setPinLength] = useState(4);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pinRequiredOnDevice, setPinRequiredOnDeviceState] = useState(true);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(true);
  const [biometryType, setBiometryType] = useState<'FaceID' | 'TouchID' | 'Biometrics' | null>(null);

  // Promise resolver for challenge prompt
  const unlockResolverRef = useRef<((unlocked: boolean) => void) | null>(null);

  // Load device preferences on mount
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

  // Check access status against backend
  const checkChatAccess = useCallback(async (): Promise<ChatAccessStatus | null> => {
    try {
      const storedToken = await getStoredChatGateToken();
      if (storedToken) {
        setIsChatUnlocked(true);
      }

      const status = await fetchChatAccessStatus();
      if (!status) return null;

      if (status.pinLength) {
        setPinLength(status.pinLength);
      }

      if (!status.configured) {
        setIsSetupRequired(true);
        setIsChatUnlocked(false);
        setModalVisible(true);
      } else if (!status.unlocked) {
        // Auto-unlock if user turned off PIN requirement on this device
        const required = await isPinRequiredOnDevice();
        const savedPin = await getSavedChatPin();
        if (!required && savedPin) {
          console.log('[ChatPinGateProvider] Device PIN is off; auto-verifying saved PIN in background...');
          const autoRes = await verifyChatPin(savedPin);
          if (autoRes.ok) {
            setIsChatUnlocked(true);
            setIsSetupRequired(false);
            setModalVisible(false);
            return status;
          }
        }

        await clearChatGateSession();
        setIsChatUnlocked(false);
        setIsSetupRequired(false);
        setModalVisible(true);
      } else {
        setIsChatUnlocked(true);
        setIsSetupRequired(false);
      }

      return status;
    } catch (err) {
      console.warn('[ChatPinGateProvider] checkChatAccess error:', err);
      return null;
    }
  }, []);

  // Prompt user to unlock (imperative call from api-client or UI)
  const promptUnlock = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      unlockResolverRef.current = resolve;
      setModalVisible(true);
    });
  }, []);

  // Lock chat manually or on background timeout
  const lockChat = useCallback(async () => {
    await lockChatRemote();
    setIsChatUnlocked(false);
  }, []);

  // Register the 403 challenge handler with api-client
  useEffect(() => {
    registerChatPinChallengeHandler(async () => {
      console.log('[ChatPinGateProvider] Handling 403 challenge...');
      const required = await isPinRequiredOnDevice();
      const savedPin = await getSavedChatPin();
      if (!required && savedPin) {
        const autoRes = await verifyChatPin(savedPin);
        if (autoRes.ok) {
          setIsChatUnlocked(true);
          return true;
        }
      }
      setIsChatUnlocked(false);
      return promptUnlock();
    });

    return () => {
      registerChatPinChallengeHandler(null);
    };
  }, [promptUnlock]);

  // Check status on mount and listen to auth changes
  useEffect(() => {
    checkChatAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        await checkChatAccess();
      } else if (event === 'SIGNED_OUT' || !session) {
        await clearChatGateSession();
        setIsChatUnlocked(false);
        setModalVisible(false);
        if (unlockResolverRef.current) {
          unlockResolverRef.current(false);
          unlockResolverRef.current = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkChatAccess]);

  const handleUnlocked = () => {
    setIsChatUnlocked(true);
    setIsSetupRequired(false);
    setModalVisible(false);
    if (unlockResolverRef.current) {
      unlockResolverRef.current(true);
      unlockResolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    if (unlockResolverRef.current) {
      unlockResolverRef.current(false);
      unlockResolverRef.current = null;
    }
  };

  return (
    <ChatPinGateContext.Provider
      value={{
        isChatUnlocked,
        pinLength,
        isSetupRequired,
        pinRequiredOnDevice,
        biometricsEnabled,
        biometryType,
        setPinRequiredOnDevice,
        setBiometricsEnabled,
        promptUnlock,
        checkChatAccess,
        lockChat,
      }}
    >
      {children}
      <ChatPinGateModal
        visible={modalVisible}
        pinLength={pinLength}
        isSetupRequired={isSetupRequired}
        onUnlocked={handleUnlocked}
        onCancel={handleCancel}
      />
    </ChatPinGateContext.Provider>
  );
}

export function useChatPinGate() {
  const context = useContext(ChatPinGateContext);
  if (context === undefined) {
    throw new Error('useChatPinGate must be used within a ChatPinGateProvider');
  }
  return context;
}
