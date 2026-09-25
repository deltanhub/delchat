import React from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';
import { AppHaptics } from '../../lib/haptics';
import { styles } from './styles';
import { TIMEOUT_OPTIONS, SettingsSecurityCardProps } from './types';

export function SettingsSecurityCard({
  appLockEnabled,
  appLockTimeout,
  onToggleAppLock,
  onSelectTimeout,
  pinRequiredOnDevice,
  onTogglePinRequired,
  biometricsEnabled,
  onToggleBiometrics,
  biometryType,
  hapticsEnabled,
  onToggleHaptics,
  colors,
}: SettingsSecurityCardProps) {
  return (
    <>
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Privacy & Security</Text>
      
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* App Lock Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Screen Lock</Text>
            <Text style={[styles.settingDesc, { color: colors.placeholder }]}>
              Require Face ID / passcode to open app
            </Text>
          </View>
          <Switch
            value={appLockEnabled}
            onValueChange={onToggleAppLock}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={appLockEnabled ? colors.primary : '#f4f3f4'}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Inactivity Timer Picker */}
        {appLockEnabled && (
          <View style={[styles.timeoutSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.timeoutHeader, { color: colors.text }]}>
              Require lock:
            </Text>
            {TIMEOUT_OPTIONS.map((option) => {
              const isSelected = appLockTimeout === option.value;
              return (
                <ScalePressable
                  key={option.value}
                  onPress={() => onSelectTimeout(option.value)}
                  style={[
                    styles.timeoutOption,
                    isSelected && { backgroundColor: colors.background }
                  ]}
                >
                  <Text
                    style={[
                      styles.timeoutLabel,
                      { color: isSelected ? colors.primary : colors.text },
                      isSelected && { fontWeight: Typography.weights.semibold }
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-sharp" size={18} color={colors.primary} />
                  )}
                </ScalePressable>
              );
            })}
          </View>
        )}

        {/* Require Chat PIN Toggle */}
        <View style={[styles.settingRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Require Chat PIN</Text>
            <Text style={[styles.settingDesc, { color: colors.placeholder }]}>
              Prompt for PIN when opening chats on this device
            </Text>
          </View>
          <Switch
            value={pinRequiredOnDevice}
            onValueChange={(val) => {
              AppHaptics.selectionAsync();
              onTogglePinRequired(val);
            }}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={pinRequiredOnDevice ? colors.primary : '#f4f3f4'}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Biometrics for Chat PIN */}
        {pinRequiredOnDevice && biometryType && (
          <View style={[styles.settingRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {biometryType === 'FaceID' ? 'Face ID for Chat' : biometryType === 'TouchID' ? 'Touch ID for Chat' : 'Biometrics for Chat'}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.placeholder }]}>
                Unlock chats instantly with {biometryType === 'FaceID' ? 'Face ID' : biometryType === 'TouchID' ? 'Touch ID' : 'biometrics'}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={(val) => {
                AppHaptics.selectionAsync();
                onToggleBiometrics(val);
              }}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={biometricsEnabled ? colors.primary : '#f4f3f4'}
              ios_backgroundColor={colors.border}
            />
          </View>
        )}

        {/* Haptic Feedback Toggle */}
        <View style={[styles.settingRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Haptic Feedback</Text>
            <Text style={[styles.settingDesc, { color: colors.placeholder }]}>
              Tactile vibration on tap, reactions, and calls
            </Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={onToggleHaptics}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={hapticsEnabled ? colors.primary : '#f4f3f4'}
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>
    </>
  );
}

export default SettingsSecurityCard;
