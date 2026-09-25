import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import {
  ChatPinGateModalProps,
  PinGateHeader,
  PinDotsRow,
  PinKeypadGrid,
  usePinGateAuth,
  styles,
} from './pin_gate';

/**
 * 500k CCU & Clean Architecture Pin Gate Specifications:
 * - Wine brand theme: `#4a0f1f`
 * - Spring keypad dynamics and haptic feedback
 * - Dynamic PIN dots indicator and wrong-entry shake animation
 * - Biometric unlock and auto-prompt on display
 */
export default function ChatPinGateModal({
  visible,
  pinLength = 4,
  isSetupRequired = false,
  onUnlocked,
  onCancel,
}: ChatPinGateModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    pin,
    targetLength,
    setupStep,
    verifying,
    errorMsg,
    biometryInfo,
    hasSavedPin,
    shakeAnim,
    handleBiometricUnlock,
    handleKeyPress,
    handleDelete,
  } = usePinGateAuth({ visible, pinLength, isSetupRequired, onUnlocked });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? '#000000' : '#f4f7fb',
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <PinGateHeader
          isSetupRequired={isSetupRequired}
          setupStep={setupStep}
          textColor={colors.text}
          placeholderColor={colors.placeholder}
          isDark={isDark}
          onCancel={onCancel}
        />

        <View style={styles.centerContainer}>
          <PinDotsRow
            targetLength={targetLength}
            pinLength={pin.length}
            shakeAnim={shakeAnim}
            isDark={isDark}
          />

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <View style={{ height: 12 }} />
          )}

          {verifying && (
            <ActivityIndicator size="small" color="#4a0f1f" style={{ marginVertical: 4 }} />
          )}

          <PinKeypadGrid
            biometryInfo={biometryInfo}
            hasSavedPin={hasSavedPin}
            isSetupRequired={isSetupRequired}
            isDark={isDark}
            colors={colors}
            onBiometricUnlock={handleBiometricUnlock}
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
          />

          {onCancel && (
            <ScalePressable onPress={onCancel} style={styles.skipButton}>
              <Text style={[styles.skipButtonText, { color: colors.placeholder }]}>
                {isSetupRequired ? 'Set Up Later' : 'Skip for Now'}
              </Text>
            </ScalePressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

export { PinGateHeader, PinDotsRow, PinKeypadGrid, usePinGateAuth };
