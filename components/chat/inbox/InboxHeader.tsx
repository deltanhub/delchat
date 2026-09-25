import React from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import type { InboxTab } from '../../../hooks/inbox/useInboxData';
import { styles } from './styles';
import { InboxTabsBar } from './InboxTabsBar';

export interface InboxHeaderProps {
  insetsTop: number;
  colors: any;
  isDark: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inboxTabs: { key: InboxTab; label: string }[];
  activeTab: InboxTab;
  setActiveTab: (tab: InboxTab) => void;
  unreadOnly: boolean;
  setUnreadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenStarred: () => void;
}

export default function InboxHeader({
  insetsTop,
  colors,
  isDark,
  searchQuery,
  setSearchQuery,
  inboxTabs,
  activeTab,
  setActiveTab,
  unreadOnly,
  setUnreadOnly,
  onOpenStarred,
}: InboxHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, { paddingTop: insetsTop + 10, borderBottomColor: colors.border }]}>
      <View style={styles.headerTop}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <View style={styles.headerButtonsRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenStarred();
            }}
            style={[
              styles.starredBtn,
              {
                backgroundColor: isDark ? '#2a1a05' : '#fef3c7',
                borderColor: isDark ? '#452608' : '#fde68a',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Starred messages"
            accessibilityHint="View all your starred favorite messages across all chats"
          >
            <Ionicons name="star" size={17} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/compose' as Href)}
            style={[styles.composeBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="New message"
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Box */}
      <View style={[styles.searchBar, { backgroundColor: isDark ? '#1f1f1f' : '#e8edf3', borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.placeholder} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations, listings, or clients..."
          placeholderTextColor={colors.placeholder}
          style={[styles.searchInput, { color: colors.text }]}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmentation Tabs */}
      <InboxTabsBar
        inboxTabs={inboxTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadOnly={unreadOnly}
        setUnreadOnly={setUnreadOnly}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}
