import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../../lib/supabase';
import { APP_LOCK_ENABLED_KEY, APP_LOCK_TIMEOUT_KEY } from './appLockTypes';

export function useAppLockLifecycle() {
  const [appLockEnabled, setAppLockEnabledState] = useState(false);
  const [appLockTimeout, setAppLockTimeoutState] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const enabledVal = await AsyncStorage.getItem(APP_LOCK_ENABLED_KEY);
        const timeoutVal = await AsyncStorage.getItem(APP_LOCK_TIMEOUT_KEY);
        if (enabledVal !== null) setAppLockEnabledState(enabledVal === 'true');
        if (timeoutVal !== null) setAppLockTimeoutState(parseInt(timeoutVal, 10));
      } catch (error) {
        console.error('[AppLock] Error loading settings:', error);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) setIsLocked(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const triggerUnlock = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setIsLocked(false);
      return true;
    }
    if (isAuthenticating) return false;
    setIsAuthenticating(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        console.warn('[AppLock] Biometrics not supported/enrolled. Bypassing lock.');
        setIsLocked(false);
        setIsAuthenticating(false);
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock DelChat',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        setIsAuthenticating(false);
        return true;
      }
    } catch (err) {
      console.error('[AppLock] Authentication error:', err);
    } finally {
      setIsAuthenticating(false);
    }
    return false;
  };

  useEffect(() => {
    if (isLocked && isAuthenticated) triggerUnlock();
  }, [isLocked, isAuthenticated]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (!appLockEnabled || !isAuthenticated) {
        appState.current = nextAppState;
        return;
      }
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (lastBackgroundTime.current !== null) {
          const elapsed = Date.now() - lastBackgroundTime.current;
          if (elapsed >= appLockTimeout) setIsLocked(true);
        }
        lastBackgroundTime.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        if (!isLocked) lastBackgroundTime.current = Date.now();
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [appLockEnabled, appLockTimeout, isAuthenticated, isLocked]);

  const setAppLockEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(APP_LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
      setAppLockEnabledState(enabled);
      if (!enabled) setIsLocked(false);
    } catch (error) {
      console.error('[AppLock] Error saving lock enabled setting:', error);
    }
  };

  const setAppLockTimeout = async (timeout: number) => {
    try {
      await AsyncStorage.setItem(APP_LOCK_TIMEOUT_KEY, timeout.toString());
      setAppLockTimeoutState(timeout);
    } catch (error) {
      console.error('[AppLock] Error saving lock timeout setting:', error);
    }
  };

  return {
    appLockEnabled, appLockTimeout, setAppLockEnabled,
    setAppLockTimeout, isLocked, isAuthenticated,
    isAuthenticating, triggerUnlock,
  };
}
