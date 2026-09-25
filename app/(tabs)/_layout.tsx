import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '../../components/useColorScheme';
import SafeBlurView from '../../components/SafeBlurView';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from '../../lib/haptics';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import { TabBarItem, tabBarStyles as styles } from '../../components/navigation';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const [containerWidth, setContainerWidth] = useState(0);
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === 'dark';
  const barBg = isDark ? 'rgba(18, 18, 18, 0.82)' : 'rgba(255, 255, 255, 0.92)';
  const barBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(74, 15, 31, 0.10)';
  const activeBubbleBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(74, 15, 31, 0.08)';
  const activeBubbleBorder = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(74, 15, 31, 0.20)';
  const activeColor = isDark ? '#ffffff' : '#4a0f1f';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.50)' : '#7a7d88';

  const { role, canReceiveLeads } = useAuthProfile();

  const isLandlord = role === 'Landlord/Owner';
  const shortLabels: Record<string, string> = {
    index: 'Inbox',
    calls: 'Calls',
    leads: isLandlord ? 'Inquiries' : 'CRM',
    settings: 'Settings',
  };

  const visibleRoutes = canReceiveLeads
    ? state.routes
    : state.routes.filter((route: any) => route.name !== 'leads');

  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name;
  const activeRouteKey = activeRoute?.key;
  const activeRouteOptions = descriptors[activeRouteKey]?.options;
  const activeVisibleIndex = visibleRoutes.findIndex((route: any) => route.name === activeRouteName);

  useEffect(() => {
    if (!canReceiveLeads && activeRouteName === 'leads') {
      navigation.navigate('index');
    }
  }, [canReceiveLeads, activeRouteName, navigation]);

  const translateX = useSharedValue(0);
  const tabWidth = containerWidth > 0 ? (containerWidth - 12) / visibleRoutes.length : 0;

  useEffect(() => {
    if (containerWidth > 0 && activeVisibleIndex !== -1 && tabWidth > 0) {
      translateX.value = withSpring(activeVisibleIndex * tabWidth, {
        mass: 1,
        stiffness: 100,
        damping: 15,
      });
    }
  }, [activeVisibleIndex, containerWidth, tabWidth]);

  const animatedHighlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  if (activeRouteOptions?.tabBarStyle?.display === 'none') return null;

  const bottomPosition = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 12);

  return (
    <View
      style={[styles.barContainer, { borderColor: barBorder, bottom: bottomPosition }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <SafeBlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        fallbackBackgroundColor={barBg}
        style={StyleSheet.absoluteFill}
      />

      {containerWidth > 0 && activeVisibleIndex !== -1 && tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeBubbleHighlight,
            { backgroundColor: activeBubbleBg, borderColor: activeBubbleBorder },
            animatedHighlightStyle,
          ]}
        />
      )}

      {visibleRoutes.map((route: any) => {
        const { options } = descriptors[route.key];
        const isFocused = activeRouteName === route.name;
        const label = shortLabels[route.name] || options.tabBarLabel || options.title || route.name;

        return (
          <TabBarItem
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            label={label}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            options={options}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name, { merge: true });
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Inbox', tabBarLabel: 'Inbox' }} />
      <Tabs.Screen name="calls" options={{ title: 'Calls', tabBarLabel: 'Calls' }} />
      <Tabs.Screen name="leads" options={{ title: 'CRM', tabBarLabel: 'CRM' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarLabel: 'Settings' }} />
    </Tabs>
  );
}
