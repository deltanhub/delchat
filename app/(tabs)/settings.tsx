import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import ScalePressable from '../../components/ScalePressable';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useAppLock } from '../../components/AppLockProvider';
import { AppHaptics } from '../../lib/haptics';
import { AgentPresence, PRESENCE_CONFIGS, AgentPresenceStatus } from '../../lib/agent-presence';

const TIMEOUT_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: 'After 1 minute', value: 60000 },
  { label: 'After 5 minutes', value: 300000 },
  { label: 'After 15 minutes', value: 900000 },
  { label: 'After 1 hour', value: 3600000 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [currentUser, setCurrentUser] = useState<any>(null);
  const { appLockEnabled, appLockTimeout, setAppLockEnabled, setAppLockTimeout } = useAppLock();
  const [hapticsEnabled, setHapticsEnabled] = useState(AppHaptics.getHapticsEnabled());
  const [presenceStatus, setPresenceStatus] = useState<AgentPresenceStatus>(AgentPresence.getStatus());

  useEffect(() => {
    return AppHaptics.subscribe(setHapticsEnabled);
  }, []);

  useEffect(() => {
    return AgentPresence.subscribe(setPresenceStatus);
  }, []);

  const handleToggleHaptics = (val: boolean) => {
    setHapticsEnabled(val);
    AppHaptics.setHapticsEnabled(val);
  };

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedPageWrapper>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
          ]}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
              Customize your DelChat preferences
            </Text>
          </View>

          {/* Profile Card */}
          {currentUser && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.profileRow}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileEmail, { color: colors.text }]} numberOfLines={1}>
                    {currentUser.email}
                  </Text>
                  <Text style={[styles.profileSubtext, { color: colors.placeholder }]}>
                    DeltanHub Member
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Brokerage Availability Section */}
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
                    AgentPresence.setStatus(statusKey);
                  }}
                  style={[
                    styles.presenceOptionRow,
                    idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    isSelected && { backgroundColor: colorScheme === 'dark' ? '#262626' : colors.primarySoft }
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

          {/* Privacy & Security Section */}
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
                onValueChange={setAppLockEnabled}
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
                      onPress={() => setAppLockTimeout(option.value)}
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
                onValueChange={handleToggleHaptics}
                trackColor={{ false: colors.border, true: colors.primaryMuted }}
                thumbColor={hapticsEnabled ? colors.primary : '#f4f3f4'}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          {/* Account Actions Section */}
          <Text style={[styles.sectionHeader, { color: colors.primary }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScalePressable
              onPress={handleSignOut}
              style={styles.signOutRow}
            >
              <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </ScalePressable>
          </View>

        </ScrollView>
      </AnimatedPageWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarLetter: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  profileSubtext: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  sectionHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 4,
  },
  settingDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    lineHeight: 16,
  },
  timeoutSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  timeoutHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: 10,
  },
  timeoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  timeoutLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
  },
  presenceExplainer: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginBottom: 10,
  },
  presenceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  presenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  presenceTextContainer: {
    flex: 1,
  },
  presenceTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  presenceSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  signOutText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#ff3b30',
    marginLeft: 12,
  },
});
