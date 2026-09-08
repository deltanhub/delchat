import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import SyncCoordinator, { SyncStatus } from '../../lib/sync-coordinator';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';

interface ConnectionBannerProps {
  statusOverride?: SyncStatus;
}

export default function ConnectionBanner({ statusOverride }: ConnectionBannerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [status, setStatus] = useState<SyncStatus>(statusOverride || SyncCoordinator.getStatus());
  const [showConnectedTemporary, setShowConnectedTemporary] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (statusOverride) {
      setStatus(statusOverride);
      return;
    }

    const unsubscribe = SyncCoordinator.subscribe((newStatus) => {
      setStatus((prev) => {
        if (prev === newStatus) return prev;
        if (prev === 'offline' && newStatus === 'online') {
          // Show "Connected" pill temporarily for 2.5 seconds
          if (timerRef.current) clearTimeout(timerRef.current);
          setShowConnectedTemporary(true);
          timerRef.current = setTimeout(() => {
            setShowConnectedTemporary(false);
            timerRef.current = null;
          }, 2500);
        } else if (newStatus !== 'online') {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setShowConnectedTemporary(false);
        }
        return newStatus;
      });
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [statusOverride]);

  if (status === 'online' && !showConnectedTemporary) {
    return null;
  }

  const isOffline = status === 'offline';
  const isSyncing = status === 'syncing';
  const isBackOnline = status === 'online' && showConnectedTemporary;

  const bgColor = isOffline
    ? isDark ? '#451a03' : '#fffbeb'
    : isSyncing
    ? isDark ? '#2a0a14' : colors.primarySoft
    : isDark ? '#052e16' : '#f0fdf4';

  const borderColor = isOffline
    ? '#f59e0b'
    : isSyncing
    ? colors.primaryMuted
    : '#16a34a';

  const textColor = isOffline
    ? isDark ? '#fef3c7' : '#92400e'
    : isSyncing
    ? colors.primary
    : isDark ? '#dcfce7' : '#166534';

  const iconName = isOffline
    ? 'cloud-offline-outline'
    : isSyncing
    ? 'sync-outline'
    : 'checkmark-circle-outline';

  const label = isOffline
    ? 'Offline'
    : isSyncing
    ? 'Syncing...'
    : 'Back online';

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.banner,
        {
          backgroundColor: bgColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={textColor} style={{ marginRight: 6 }} />
        ) : (
          <Ionicons name={iconName} size={15} color={textColor} style={{ marginRight: 6 }} />
        )}
        <Text style={[styles.text, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
});
