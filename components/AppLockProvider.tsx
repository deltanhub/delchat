import React, { createContext, useContext } from 'react';
import { AppLockContextType } from './security/appLockTypes';
import { useAppLockLifecycle } from './security/useAppLockLifecycle';
import AppLockOverlay from './AppLockOverlay';

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const lifecycle = useAppLockLifecycle();

  return (
    <AppLockContext.Provider
      value={{
        appLockEnabled: lifecycle.appLockEnabled,
        appLockTimeout: lifecycle.appLockTimeout,
        setAppLockEnabled: lifecycle.setAppLockEnabled,
        setAppLockTimeout: lifecycle.setAppLockTimeout,
        isLocked: lifecycle.isLocked,
        triggerUnlock: lifecycle.triggerUnlock,
      }}
    >
      {children}
      {lifecycle.isLocked && lifecycle.isAuthenticated && (
        <AppLockOverlay
          onUnlock={lifecycle.triggerUnlock}
          isAuthenticating={lifecycle.isAuthenticating}
        />
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
