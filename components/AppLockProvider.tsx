import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../lib/supabase';
import AppLockOverlay from './AppLockOverlay';

interface AppLockContextType {
  appLockEnabled: boolean;
  appLockTimeout: number; // in milliseconds
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  setAppLockTimeout: (timeout: number) => Promise<void>;
  isLocked: boolean;
  triggerUnlock: () => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

const ENABLED_KEY = 'DELCHAT_APP_LOCK_ENABLED';
const TIMEOUT_KEY = 'DELCHAT_APP_LOCK_TIMEOUT';

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [appLockEnabled, setAppLockEnabledState] = useState(false);
  const [appLockTimeout, setAppLockTimeoutState] = useState(0); // Default: immediately (0ms)
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const enabledVal = await AsyncStorage.getItem(ENABLED_KEY);
        const timeoutVal = await AsyncStorage.getItem(TIMEOUT_KEY);

        if (enabledVal !== null) {
          setAppLockEnabledState(enabledVal === 'true');
        }
        if (timeoutVal !== null) {
          setAppLockTimeoutState(parseInt(timeoutVal, 10));
        }
      } catch (error) {
        console.error('[AppLock] Error loading settings:', error);
      }
    }
    loadSettings();
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        // Clear lock state if signed out
        setIsLocked(false);
      }
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

  // Trigger unlock when isLocked becomes true
  useEffect(() => {
    if (isLocked && isAuthenticated) {
      triggerUnlock();
    }
  }, [isLocked, isAuthenticated]);

  // AppState change listener
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Check if user is authenticated and app lock is enabled
      if (!appLockEnabled || !isAuthenticated) {
        appState.current = nextAppState;
        return;
      }

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[AppLock] App returning to active foreground.');
        if (lastBackgroundTime.current !== null) {
          const elapsed = Date.now() - lastBackgroundTime.current;
          console.log(`[AppLock] Inactive for ${elapsed}ms. Timeout is ${appLockTimeout}ms.`);
          if (elapsed >= appLockTimeout) {
            setIsLocked(true);
          }
        }
        lastBackgroundTime.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('[AppLock] App entering background.');
        // Only set background time if we aren't already locked
        if (!isLocked) {
          lastBackgroundTime.current = Date.now();
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [appLockEnabled, appLockTimeout, isAuthenticated, isLocked]);

  const setAppLockEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
      setAppLockEnabledState(enabled);
      if (!enabled) {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('[AppLock] Error saving lock enabled setting:', error);
    }
  };

  const setAppLockTimeout = async (timeout: number) => {
    try {
      await AsyncStorage.setItem(TIMEOUT_KEY, timeout.toString());
      setAppLockTimeoutState(timeout);
    } catch (error) {
      console.error('[AppLock] Error saving lock timeout setting:', error);
    }
  };

  return (
    <AppLockContext.Provider
      value={{
        appLockEnabled,
        appLockTimeout,
        setAppLockEnabled,
        setAppLockTimeout,
        isLocked,
        triggerUnlock,
      }}
    >
      {children}
      {isLocked && isAuthenticated && (
        <AppLockOverlay onUnlock={triggerUnlock} isAuthenticating={isAuthenticating} />
      )}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (context === undefined) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
