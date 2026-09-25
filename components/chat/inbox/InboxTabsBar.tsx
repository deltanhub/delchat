import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import ScalePressable from '../../../components/ScalePressable';
import * as Haptics from '../../../lib/haptics';
import type { InboxTab } from '../../../hooks/inbox/useInboxData';
import { styles } from './styles';

export interface InboxTabsBarProps {
  inboxTabs: { key: InboxTab; label: string }[];
  activeTab: InboxTab;
  setActiveTab: (tab: InboxTab) => void;
  unreadOnly: boolean;
  setUnreadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  colors: any;
  isDark: boolean;
}

export function InboxTabsBar({
  inboxTabs,
  activeTab,
  setActiveTab,
  unreadOnly,
  setUnreadOnly,
  colors,
  isDark,
}: InboxTabsBarProps) {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsList}
        style={{ flex: 1, marginRight: 8 }}
      >
        {inboxTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <ScalePressable
              key={tab.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
              style={[
                styles.tabItem,
                isActive && {
                  backgroundColor: isDark ? '#4a0f1f' : colors.primarySoft,
                  borderColor: isDark ? '#6e1a30' : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? isDark ? '#ffffff' : colors.primary
                      : isDark ? '#ffffff' : colors.placeholder,
                  },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
            </ScalePressable>
          );
        })}
      </ScrollView>

      {/* Unread Toggle Pill */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setUnreadOnly((prev) => !prev);
        }}
        style={[
          styles.unreadFilterPill,
          isDark && { borderColor: unreadOnly ? colors.primary : 'rgba(255, 255, 255, 0.3)' },
          unreadOnly && { backgroundColor: colors.primary },
        ]}
      >
        <Text
          style={[
            styles.unreadFilterText,
            { color: unreadOnly ? '#ffffff' : isDark ? '#ffffff' : colors.placeholder },
          ]}
        >
          Unread
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default InboxTabsBar;
