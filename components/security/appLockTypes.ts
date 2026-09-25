export interface AppLockContextType {
  appLockEnabled: boolean;
  appLockTimeout: number; // in milliseconds
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  setAppLockTimeout: (timeout: number) => Promise<void>;
  isLocked: boolean;
  triggerUnlock: () => Promise<boolean>;
}

export const APP_LOCK_ENABLED_KEY = 'DELCHAT_APP_LOCK_ENABLED';
export const APP_LOCK_TIMEOUT_KEY = 'DELCHAT_APP_LOCK_TIMEOUT';
