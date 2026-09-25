export interface ChatAccessStatus {
  configured: boolean;
  unlocked: boolean;
  pinLength: number | null;
  backupCodesRemaining: number;
  lastVerifiedAt: string | null;
  activeRecoveryRequest?: {
    id: string;
    status: string;
    createdAt: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
  } | null;
}

export const STORAGE_KEY_TOKEN = '@delchat_chat_gate_token';
export const STORAGE_KEY_EXPIRES_AT = '@delchat_chat_gate_expires_at';
export const STORAGE_KEY_PIN_LENGTH = '@delchat_chat_gate_pin_length';
export const STORAGE_KEY_SAVED_PIN = '@delchat_saved_chat_pin';
export const STORAGE_KEY_PIN_REQUIRED = '@delchat_pin_required_on_device';
export const STORAGE_KEY_BIOMETRICS_ENABLED = '@delchat_biometrics_enabled';

export const DELTANHUB_API_URL = (
  process.env.EXPO_PUBLIC_DELTANHUB_API_URL || 'https://deltanhub.com'
).replace(/\/+$/, '');
