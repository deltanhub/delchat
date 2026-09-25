import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  fetchChatAccessStatus,
  getStoredChatGateToken,
  clearChatGateSession,
  lockChatRemote,
  ChatAccessStatus,
} from '../../../lib/chat-security-service';
import { registerChatPinChallengeHandler } from '../../../lib/api-client';
import { useChatPinPreferences, tryAutoUnlockWithSavedPin } from './useChatPinPreferences';

export function useChatPinGateState() {
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [pinLength, setPinLength] = useState(4);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    pinRequiredOnDevice,
    biometricsEnabled,
    biometryType,
    setPinRequiredOnDevice,
    setBiometricsEnabled,
  } = useChatPinPreferences();

  const unlockResolverRef = useRef<((unlocked: boolean) => void) | null>(null);
  const isDismissedRef = useRef(false);

  const checkChatAccess = useCallback(async (): Promise<ChatAccessStatus | null> => {
    try {
      const storedToken = await getStoredChatGateToken();
      if (storedToken) setIsChatUnlocked(true);

      const status = await fetchChatAccessStatus();
      if (!status) return null;

      if (status.pinLength) setPinLength(status.pinLength);

      if (!status.configured) {
        setIsSetupRequired(false);
        setIsChatUnlocked(true);
        setModalVisible(false);
      } else if (!status.unlocked) {
        if (await tryAutoUnlockWithSavedPin()) {
          setIsChatUnlocked(true);
          setIsSetupRequired(false);
          setModalVisible(false);
          return status;
        }
        await clearChatGateSession();
        setIsChatUnlocked(false);
        setIsSetupRequired(false);
        if (!isDismissedRef.current) {
          setModalVisible(true);
        }
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

  const promptUnlock = useCallback((force = false): Promise<boolean> => {
    if (isDismissedRef.current && !force) return Promise.resolve(false);
    isDismissedRef.current = false;
    return new Promise((resolve) => {
      unlockResolverRef.current = resolve;
      setModalVisible(true);
    });
  }, []);

  const lockChat = useCallback(async () => {
    await lockChatRemote();
    setIsChatUnlocked(false);
  }, []);

  useEffect(() => {
    registerChatPinChallengeHandler(async () => {
      if (isDismissedRef.current) return false;
      if (await tryAutoUnlockWithSavedPin()) {
        setIsChatUnlocked(true);
        return true;
      }
      setIsChatUnlocked(false);
      return promptUnlock();
    });
    return () => registerChatPinChallengeHandler(null);
  }, [promptUnlock]);

  useEffect(() => {
    checkChatAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        isDismissedRef.current = false;
        await checkChatAccess();
      } else if (event === 'SIGNED_OUT' || !session) {
        await clearChatGateSession();
        isDismissedRef.current = false;
        setIsChatUnlocked(false);
        setModalVisible(false);
        if (unlockResolverRef.current) {
          unlockResolverRef.current(false);
          unlockResolverRef.current = null;
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [checkChatAccess]);

  const handleUnlocked = () => {
    isDismissedRef.current = false;
    setIsChatUnlocked(true);
    setIsSetupRequired(false);
    setModalVisible(false);
    if (unlockResolverRef.current) {
      unlockResolverRef.current(true);
      unlockResolverRef.current = null;
    }
  };

  const handleCancel = () => {
    isDismissedRef.current = true;
    setModalVisible(false);
    if (unlockResolverRef.current) {
      unlockResolverRef.current(false);
      unlockResolverRef.current = null;
    }
  };

  return {
    isChatUnlocked, pinLength, isSetupRequired, modalVisible,
    pinRequiredOnDevice, biometricsEnabled, biometryType,
    setPinRequiredOnDevice, setBiometricsEnabled, promptUnlock,
    checkChatAccess, lockChat, handleUnlocked, handleCancel,
  };
}
