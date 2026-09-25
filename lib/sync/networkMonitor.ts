import { AppState, type AppStateStatus } from 'react-native';
import { SyncStatus } from './types';
import { calculateJitter, touchUserPresenceSafely } from './stormShield';

let _syncStatus: SyncStatus = 'online';
const _statusListeners = new Set<(status: SyncStatus) => void>();
let _inFlightConnectivityPromise: Promise<boolean> | null = null;
let _appStateSubscribed = false;

export function getStatus(): SyncStatus {
  return _syncStatus;
}

export function setStatus(status: SyncStatus): void {
  if (_syncStatus === status) return;
  _syncStatus = status;
  _statusListeners.forEach((fn) => fn(status));
}

/**
 * Proactively verify active internet connectivity against the API.
 * Features in-flight request coalescing to prevent duplicate probes.
 */
export async function checkConnectivity(): Promise<boolean> {
  if (_inFlightConnectivityPromise) {
    return _inFlightConnectivityPromise;
  }

  _inFlightConnectivityPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://deltanhub.com', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      const isOnline = res.status < 500;
      setStatus(isOnline ? 'online' : 'offline');
      return isOnline;
    } catch {
      setStatus('offline');
      return false;
    } finally {
      _inFlightConnectivityPromise = null;
    }
  })();

  return _inFlightConnectivityPromise;
}

export function ensureAppStateListener(): void {
  if (_appStateSubscribed) return;
  _appStateSubscribed = true;
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      // 500k CCU Storm Shield: apply randomized jitter to prevent edge gateway pounding
      const jitterMs = calculateJitter(500, 3500);
      setTimeout(() => {
        void checkConnectivity();
        void touchUserPresenceSafely();
      }, jitterMs);
    }
  });
}

export function subscribe(listener: (status: SyncStatus) => void): () => void {
  ensureAppStateListener();
  _statusListeners.add(listener);
  listener(_syncStatus);
  return () => {
    _statusListeners.delete(listener);
  };
}
