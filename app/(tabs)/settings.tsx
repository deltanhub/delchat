import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import { useAppLock } from '../../components/AppLockProvider';
import { useChatPinGate } from '../../components/chat/security/ChatPinGateProvider';
import { AppHaptics } from '../../lib/haptics';
import { AgentPresence, AgentPresenceStatus } from '../../lib/agent-presence';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import { clearProfileCache } from '../../lib/auth';
import { resolveAvatarUrl } from '../../lib/media-utils';
import {
  styles,
  SettingsHeader,
  SettingsProfileCard,
  SettingsPresenceCard,
  SettingsSecurityCard,
  SettingsAccountCard,
} from '../../components/settings';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const { profile, role, isProfessional, roleLabel } = useAuthProfile();
  const { appLockEnabled, appLockTimeout, setAppLockEnabled, setAppLockTimeout } = useAppLock();
  const {
    pinRequiredOnDevice,
    setPinRequiredOnDevice,
    biometricsEnabled,
    setBiometricsEnabled,
    biometryType,
  } = useChatPinGate();
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
    clearProfileCache();
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const displayName =
    profile?.fullName ||
    profile?.displayName ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.email?.split('@')[0] ||
    'DeltanHub Member';
  const userEmail = profile?.email || currentUser?.email || '';
  const avatarUrl = resolveAvatarUrl(profile?.avatarUrl || currentUser?.user_metadata?.avatar_url);
  const initialLetter = (displayName || userEmail || 'U').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AnimatedPageWrapper>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 },
          ]}
        >
          <SettingsHeader colors={colors} />

          {(currentUser || profile) && (
            <SettingsProfileCard
              profile={profile}
              role={role}
              roleLabel={roleLabel}
              displayName={displayName}
              userEmail={userEmail}
              avatarUrl={avatarUrl}
              initialLetter={initialLetter}
              colors={colors}
              isDark={isDark}
              roleBadgeStyle={styles.roleBadge}
            />
          )}

          {/* Brokerage Availability Section (Professionals Only: Agency, Developer, Agent, Landlord/Owner) */}
          {isProfessional && (
            <SettingsPresenceCard
              presenceStatus={presenceStatus}
              colors={colors}
              isDark={isDark}
              onSelectStatus={(statusKey) => AgentPresence.setStatus(statusKey)}
            />
          )}

          <SettingsSecurityCard
            appLockEnabled={appLockEnabled}
            appLockTimeout={appLockTimeout}
            onToggleAppLock={setAppLockEnabled}
            onSelectTimeout={setAppLockTimeout}
            pinRequiredOnDevice={pinRequiredOnDevice}
            onTogglePinRequired={setPinRequiredOnDevice}
            biometricsEnabled={biometricsEnabled}
            onToggleBiometrics={setBiometricsEnabled}
            biometryType={biometryType}
            hapticsEnabled={hapticsEnabled}
            onToggleHaptics={handleToggleHaptics}
            colors={colors}
          />

          <SettingsAccountCard
            colors={colors}
            onSignOut={handleSignOut}
          />
        </ScrollView>
      </AnimatedPageWrapper>
    </View>
  );
}
