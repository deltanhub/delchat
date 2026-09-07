import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { Typography } from '../../constants/Typography';
import ScalePressable from '../../components/ScalePressable';
import SafeBlurView from '../../components/SafeBlurView';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from '../../lib/haptics';
import { useAuthProfile } from '../../hooks/useAuthProfile';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const [containerWidth, setContainerWidth] = useState(0);
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  // Dynamic theme colors matching DeltanHub signature styling
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
    leads: isLandlord ? 'Inquiries' : 'CRM', // leads: isLandlord ? 'Inquiries' : 'Leads'
    settings: 'Settings',
  };

  // Only display Leads/Inquiries tab to professional roles (Agency, Developer, Agent, Landlord/Owner)
  const visibleRoutes = canReceiveLeads
    ? state.routes
    : state.routes.filter((route: any) => route.name !== 'leads');

  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name;
  const activeRouteKey = activeRoute?.key;
  const activeRouteOptions = descriptors[activeRouteKey]?.options;
  const activeVisibleIndex = visibleRoutes.findIndex((route: any) => route.name === activeRouteName);

  // Defensive redirect if non-privileged user (e.g. Buyer) attempts to view leads tab
  useEffect(() => {
    if (!canReceiveLeads && activeRouteName === 'leads') {
      navigation.navigate('index');
    }
  }, [canReceiveLeads, activeRouteName, navigation]);

  // Reanimated shared value for sliding the highlight bubble
  const translateX = useSharedValue(0);

  const tabWidth = containerWidth > 0 ? (containerWidth - 12) / visibleRoutes.length : 0;

  useEffect(() => {
    if (containerWidth > 0 && activeVisibleIndex !== -1 && tabWidth > 0) {
      // Standard Apple Spring Settings from AGENTS.md (mass: 1, stiffness: 100, damping: 15)
      translateX.value = withSpring(activeVisibleIndex * tabWidth, {
        mass: 1,
        stiffness: 100,
        damping: 15,
      });
    }
  }, [activeVisibleIndex, containerWidth, tabWidth]);

  const animatedHighlightStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth,
    };
  });

  const onLayout = (event: any) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  if (activeRouteOptions?.tabBarStyle?.display === 'none') {
    return null;
  }

  // Floating offset: safely elevated above home indicator on iOS or screen bottom on Android
  const bottomPosition = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 12);

  const renderIcon = (name: string, isFocused: boolean, color: string) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'chatbubbles-outline';
    if (name === 'index') {
      iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
    } else if (name === 'calls') {
      iconName = isFocused ? 'call' : 'call-outline';
    } else if (name === 'leads') {
      iconName = isFocused ? 'briefcase' : 'briefcase-outline';
    } else if (name === 'settings') {
      iconName = isFocused ? 'settings' : 'settings-outline';
    }
    return <Ionicons name={iconName} size={21} color={color} />;
  };

  return (
    <View
      style={[
        styles.barContainer,
        {
          borderColor: barBorder,
          bottom: bottomPosition,
        },
      ]}
      onLayout={onLayout}
    >
      {/* Liquid Glass Frosted Chrome Backdrop */}
      <SafeBlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        fallbackBackgroundColor={barBg}
        style={StyleSheet.absoluteFill}
      />

      {/* Slide Toggle Highlight Bubble */}
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

      {/* Interactive Tab Items */}
      {visibleRoutes.map((route: any) => {
        const { options } = descriptors[route.key];
        const isFocused = activeRouteName === route.name;
        const label = shortLabels[route.name] || options.tabBarLabel || options.title || route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name, { merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <View key={route.key} style={styles.tabItemFlex}>
            <ScalePressable
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || label}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButtonContainer}
            >
              {renderIcon(route.name, isFocused, isFocused ? activeColor : inactiveColor)}
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontWeight: isFocused ? '600' : '400',
                  },
                ]}
              >
                {label}
              </Text>
            </ScalePressable>
          </View>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false, // Edge-to-edge custom headers handled inside each screen
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          tabBarLabel: 'Inbox',
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarLabel: 'Calls',
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'CRM',
          tabBarLabel: 'CRM',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 66,
    borderRadius: 33,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  activeBubbleHighlight: {
    position: 'absolute',
    left: 6, // matches paddingHorizontal of barContainer
    height: 52,
    top: 6, // vertical centering: (66 - 52) / 2 = 7
    borderRadius: 26,
    borderWidth: 1,
  },
  tabItemFlex: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonContainer: {
    height: 52,
    width: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
});
