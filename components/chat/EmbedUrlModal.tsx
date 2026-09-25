import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  EmbedUrlModalProps,
  styles,
  useEmbedUrlForm,
  EmbedHeader,
  EmbedUrlInput,
  EmbedTitleInput,
  EmbedActionButtons,
} from './embed';

export { EmbedUrlModalProps } from './embed';

export default function EmbedUrlModal({
  visible,
  onClose,
  onSubmit,
}: EmbedUrlModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    url,
    setUrl,
    title,
    setTitle,
    error,
    setError,
    handlePaste,
    handleSubmit,
  } = useEmbedUrlForm({ onSubmit, onClose });

  if (!visible) return null;

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
          <EmbedHeader
            onClose={onClose}
            textColor={colors.text}
            placeholderColor={colors.placeholder}
          />

          <EmbedUrlInput
            url={url}
            setUrl={setUrl}
            error={error}
            setError={setError}
            onPaste={handlePaste}
            textColor={colors.text}
            placeholderColor={colors.placeholder}
            primaryColor={colors.primary}
            isDark={isDark}
          />

          <EmbedTitleInput
            title={title}
            setTitle={setTitle}
            textColor={colors.text}
            placeholderColor={colors.placeholder}
            isDark={isDark}
          />

          <EmbedActionButtons
            onClose={onClose}
            onSubmit={handleSubmit}
            textColor={colors.text}
            primaryColor={colors.primary}
            isDark={isDark}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
