import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../../ScalePressable';
import { styles } from './styles';
import { PinKeypadGridProps } from './types';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['action', '0', 'backspace'],
];

export function PinKeypadGrid({
  biometryInfo,
  hasSavedPin,
  isSetupRequired,
  isDark,
  colors,
  onBiometricUnlock,
  onKeyPress,
  onDelete,
}: PinKeypadGridProps) {
  return (
    <View style={styles.keypadContainer}>
      {KEYPAD_ROWS.map((row, rIdx) => (
        <View key={rIdx} style={styles.keypadRow}>
          {row.map((item) => {
            if (item === 'action') {
              if (biometryInfo.available && hasSavedPin && !isSetupRequired) {
                return (
                  <ScalePressable
                    key="bio"
                    onPress={onBiometricUnlock}
                    containerStyle={styles.keyContainer}
                    style={[
                      styles.key,
                      {
                        backgroundColor: isDark ? '#141416' : '#ffffff',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                      },
                    ]}
                  >
                    <Ionicons
                      name={biometryInfo.biometryType === 'FaceID' ? 'scan-outline' : 'finger-print-outline'}
                      size={26}
                      color="#4a0f1f"
                    />
                  </ScalePressable>
                );
              }
              return <View key="empty" style={styles.keyContainer} />;
            }

            if (item === 'backspace') {
              return (
                <ScalePressable
                  key="del"
                  onPress={onDelete}
                  containerStyle={styles.keyContainer}
                  style={[
                    styles.key,
                    {
                      backgroundColor: isDark ? '#141416' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                    },
                  ]}
                >
                  <Ionicons name="backspace-outline" size={24} color={colors.text} />
                </ScalePressable>
              );
            }

            return (
              <ScalePressable
                key={item}
                onPress={() => onKeyPress(item)}
                containerStyle={styles.keyContainer}
                style={[
                  styles.key,
                  {
                    backgroundColor: isDark ? '#141416' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                  },
                ]}
              >
                <Text style={[styles.keyDigit, { color: colors.text }]}>{item}</Text>
              </ScalePressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
