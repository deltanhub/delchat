import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import * as Haptics from '../../lib/haptics';

// Safe dynamic clipboard fallback
let ExpoClipboard: any = null;
try {
  ExpoClipboard = require('expo-clipboard');
} catch {}

const TRUSTED_3D_DOMAINS = [
  'matterport.com',
  'kuula.co',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'deltanhub.com',
  'google.com',
];

interface EmbedUrlModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (url: string, title?: string) => void;
}

export default function EmbedUrlModal({
  visible,
  onClose,
  onSubmit,
}: EmbedUrlModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handlePaste = async () => {
    try {
      if (ExpoClipboard?.getStringAsync) {
        const text = await ExpoClipboard.getStringAsync();
        if (text) {
          setUrl(text.trim());
          setError(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch {
      // Ignore clipboard read error
    }
  };

  const executeSubmit = (targetUrl: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(targetUrl, title.trim() || undefined);
    setUrl('');
    setTitle('');
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a valid URL.');
      return;
    }

    if (!trimmed.startsWith('https://')) {
      setError('For security, all virtual tours and embeds must use secure https:// (http:// is not permitted).');
      return;
    }

    let hostname = '';
    try {
      hostname = new URL(trimmed).hostname.toLowerCase();
    } catch {
      setError('Please enter a valid, complete web URL format.');
      return;
    }

    const isTrusted = TRUSTED_3D_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isTrusted) {
      Alert.alert(
        'Unverified External Domain',
        `This link points to an external website (${hostname}) that is not on the verified virtual tour whitelist (Matterport, Kuula, YouTube, Vimeo, DeltanHub).\n\nDo you confirm this is a trusted 3D showcase or media resource and wish to share it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Anyway',
            style: 'destructive',
            onPress: () => executeSubmit(trimmed),
          },
        ]
      );
      return;
    }

    executeSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlayDismiss} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1a1a1e' : '#ffffff',
              borderColor: isDark ? '#2c2c32' : '#e5e7eb',
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>3D Tour & Video Embed</Text>
              <Text style={[styles.subtitle, { color: colors.placeholder }]}>
                Share a Matterport 3D showcase, virtual walkthrough, or YouTube tour
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* URL Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.placeholder }]}>EMBED URL (REQUIRED)</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#24242a' : '#f3f4f6',
                  borderColor: error ? '#ef4444' : isDark ? '#33333b' : '#e5e7eb',
                },
              ]}
            >
              <Ionicons name="link-outline" size={18} color={colors.placeholder} style={{ marginRight: 8 }} />
              <TextInput
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setError(null);
                }}
                placeholder="https://my.matterport.com/show/?m=..."
                placeholderTextColor={colors.placeholder}
                style={[styles.textInput, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity onPress={handlePaste} style={styles.pasteBtn}>
                <Text style={[styles.pasteBtnText, { color: colors.primary }]}>Paste</Text>
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 5 }}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              <Text style={{ fontSize: 11, color: colors.placeholder, fontFamily: Typography.fontFamily }}>
                Verified 3D providers: Matterport, Kuula, YouTube, Vimeo, DeltanHub
              </Text>
            </View>
          </View>

          {/* Optional Title Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.placeholder }]}>DISPLAY TITLE (OPTIONAL)</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#24242a' : '#f3f4f6',
                  borderColor: isDark ? '#33333b' : '#e5e7eb',
                },
              ]}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.placeholder} style={{ marginRight: 8 }} />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Master Bedroom 3D Virtual Showcase"
                placeholderTextColor={colors.placeholder}
                style={[styles.textInput, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: isDark ? '#33333b' : '#e5e7eb' }]}>
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.submitBtnText}>Embed in Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    marginTop: 3,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: Typography.fontFamily,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    paddingVertical: 0,
  },
  pasteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pasteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  submitBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
});
