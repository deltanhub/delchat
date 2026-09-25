import { AgentPresenceStatus } from '../../lib/agent-presence';

export interface TimeoutOption {
  label: string;
  value: number;
}

export const TIMEOUT_OPTIONS: TimeoutOption[] = [
  { label: 'Immediately', value: 0 },
  { label: 'After 1 minute', value: 60000 },
  { label: 'After 5 minutes', value: 300000 },
  { label: 'After 15 minutes', value: 900000 },
  { label: 'After 1 hour', value: 3600000 },
];

export interface SettingsHeaderProps {
  colors: any;
}

export interface SettingsProfileCardProps {
  profile: any;
  role: string | null;
  roleLabel: string;
  displayName: string;
  userEmail: string;
  avatarUrl: string | null;
  initialLetter: string;
  colors: any;
  isDark: boolean;
  roleBadgeStyle?: any;
}

export interface SettingsPresenceCardProps {
  presenceStatus: AgentPresenceStatus;
  colors: any;
  isDark: boolean;
  onSelectStatus: (status: AgentPresenceStatus) => void;
}

export interface SettingsSecurityCardProps {
  appLockEnabled: boolean;
  appLockTimeout: number;
  onToggleAppLock: (enabled: boolean) => void;
  onSelectTimeout: (timeout: number) => void;
  pinRequiredOnDevice: boolean;
  onTogglePinRequired: (required: boolean) => void;
  biometricsEnabled: boolean;
  onToggleBiometrics: (enabled: boolean) => void;
  biometryType: string | null;
  hapticsEnabled: boolean;
  onToggleHaptics: (enabled: boolean) => void;
  colors: any;
}

export interface SettingsAccountCardProps {
  colors: any;
  onSignOut: () => void;
}
