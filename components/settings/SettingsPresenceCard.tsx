import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../ScalePressable';
import { AppHaptics } from '../../lib/haptics';
import { PRESENCE_CONFIGS, AgentPresenceStatus } from '../../lib/agent-presence';
import { styles } from './styles';
import { SettingsPresenceCardProps } from './types';

export function SettingsPresenceCard({
  presenceStatus,
  colors,
  isDark,
  onSelectStatus,
}: SettingsPresenceCardProps) {
  return (
    <>
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Brokerage Availability</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.presenceExplainer, { color: colors.placeholder }]}>
          Set your live operational presence. Visible across DelChat mobile and DeltanHub client portals.
        </Text>
        {(['available', 'busy', 'away'] as AgentPresenceStatus[]).map((statusKey, idx) => {
          const cfg = PRESENCE_CONFIGS[statusKey];
          const isSelected = presenceStatus === statusKey;
          return (
            <ScalePressable
              key={statusKey}
              onPress={() => {
                AppHaptics.selectionAsync();
                onSelectStatus(statusKey);
              }}
              style={[
                styles.presenceOptionRow,
                idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                isSelected && { backgroundColor: isDark ? '#262626' : colors.primarySoft }
              ]}
            >
              <View style={[styles.presenceDot, { backgroundColor: cfg.color }]} />
              <View style={styles.presenceTextContainer}>
                <Text style={[styles.presenceTitle, { color: colors.text }]}>
                  {cfg.label}
                </Text>
                <Text style={[styles.presenceSubtitle, { color: colors.placeholder }]}>
                  {cfg.subtitle}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </ScalePressable>
          );
        })}
      </View>
    </>
  );
}

export default SettingsPresenceCard;
