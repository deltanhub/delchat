import AsyncStorage from '@react-native-async-storage/async-storage';

export type AgentPresenceStatus = 'available' | 'busy' | 'away';

export interface AgentPresenceConfig {
  status: AgentPresenceStatus;
  label: string;
  subtitle: string;
  color: string;
  bgLight: string;
  bgDark: string;
  icon: string;
}

export const PRESENCE_CONFIGS: Record<AgentPresenceStatus, AgentPresenceConfig> = {
  available: {
    status: 'available',
    label: 'Available',
    subtitle: 'Ready for client inquiries & live calls',
    color: '#16a34a',
    bgLight: '#f0fdf4',
    bgDark: '#052e16',
    icon: 'radio-button-on',
  },
  busy: {
    status: 'busy',
    label: 'In Meeting',
    subtitle: 'On property viewing or client consultation',
    color: '#d97706',
    bgLight: '#fffbeb',
    bgDark: '#451a03',
    icon: 'time',
  },
  away: {
    status: 'away',
    label: 'Away / Offline',
    subtitle: 'After business hours; inquiries queued',
    color: '#64748b',
    bgLight: '#f8fafc',
    bgDark: '#1e293b',
    icon: 'moon',
  },
};

const PRESENCE_STORAGE_KEY = '@delchat_agent_presence_status';

let _currentStatus: AgentPresenceStatus = 'available';
const listeners = new Set<(status: AgentPresenceStatus) => void>();

// Initialize from storage on app load
(async () => {
  try {
    const stored = await AsyncStorage.getItem(PRESENCE_STORAGE_KEY);
    if (stored === 'available' || stored === 'busy' || stored === 'away') {
      _currentStatus = stored;
      listeners.forEach((fn) => fn(_currentStatus));
    }
  } catch {
    // Default to 'available'
  }
})();

export const AgentPresence = {
  /**
   * Get current operational status synchronously
   */
  getStatus(): AgentPresenceStatus {
    return _currentStatus;
  },

  /**
   * Get config metadata for current or specified status
   */
  getConfig(status: AgentPresenceStatus = _currentStatus): AgentPresenceConfig {
    return PRESENCE_CONFIGS[status] || PRESENCE_CONFIGS.available;
  },

  /**
   * Update status, persist to disk, and notify all subscribers
   */
  async setStatus(newStatus: AgentPresenceStatus): Promise<void> {
    _currentStatus = newStatus;
    listeners.forEach((fn) => fn(newStatus));
    try {
      await AsyncStorage.setItem(PRESENCE_STORAGE_KEY, newStatus);
    } catch (e) {
      console.warn('[AgentPresence] Failed to save presence status:', e);
    }
  },

  /**
   * Subscribe to presence status changes
   */
  subscribe(listener: (status: AgentPresenceStatus) => void): () => void {
    listeners.add(listener);
    listener(_currentStatus);
    return () => {
      listeners.delete(listener);
    };
  },
};

export default AgentPresence;
