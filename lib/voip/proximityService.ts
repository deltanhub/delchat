import { Platform, NativeModules } from 'react-native';

export type ProximityListener = (isNear: boolean) => void;

/**
 * Enterprise Proximity Sensor Service for DelChat VoIP Calls.
 * 
 * Manages proximity sensor activation during active earpiece voice calls.
 * Automatically blanks the display and disables touch events when the device
 * is placed near the user's face, preventing accidental cheek inputs.
 */
class ProximityService {
  private isEnabled = false;
  private isNear = false;
  private listeners = new Set<ProximityListener>();
  private nativeProximityModule: any = null;

  constructor() {
    this.detectNativeModule();
  }

  private detectNativeModule(): void {
    if (Platform.OS === 'web') return;

    try {
      // Check for native proximity or InCallManager modules if available
      const nativeInCallManager = NativeModules.InCallManager;
      const nativeProximity = NativeModules.RNProximity;
      this.nativeProximityModule = nativeInCallManager || nativeProximity || null;
    } catch {
      this.nativeProximityModule = null;
    }
  }

  /**
   * Activate proximity sensing for an active earpiece audio call.
   */
  public enableProximity(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;

    try {
      if (this.nativeProximityModule?.startProximitySensor) {
        this.nativeProximityModule.startProximitySensor();
      } else if (this.nativeProximityModule?.setKeepScreenOn) {
        this.nativeProximityModule.setKeepScreenOn(false);
      }
    } catch (err) {
      console.warn('[ProximityService] Native enable error:', err);
    }
  }

  /**
   * Deactivate proximity sensing upon speakerphone toggle, video call start, or call teardown.
   */
  public disableProximity(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.setNear(false);

    try {
      if (this.nativeProximityModule?.stopProximitySensor) {
        this.nativeProximityModule.stopProximitySensor();
      }
    } catch (err) {
      console.warn('[ProximityService] Native disable error:', err);
    }
  }

  /**
   * Internal/test state transition trigger.
   */
  public setNear(isNear: boolean): void {
    if (!this.isEnabled && isNear) return;
    if (this.isNear === isNear) return;

    this.isNear = isNear;
    this.notifyListeners();
  }

  public getIsNear(): boolean {
    return this.isNear;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public subscribe(listener: ProximityListener): () => void {
    this.listeners.add(listener);
    listener(this.isNear);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn(this.isNear);
      } catch (err) {
        console.warn('[ProximityService] Listener error:', err);
      }
    });
  }
}

export const proximityService = new ProximityService();
