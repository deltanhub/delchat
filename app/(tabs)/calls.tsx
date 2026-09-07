import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import ScalePressable from '../../components/ScalePressable';
import * as Haptics from '../../lib/haptics';
import RecentCallsList from '../../components/chat/RecentCallsList';

export default function CallsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
    });
  }, []);

  const handleSelectConversation = (conversationId: string, partnerName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/thread/[id]',
      params: { id: conversationId, partnerName },
    });
  };

  const handleNewCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/compose');
  };

  return (
    <AnimatedPageWrapper>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Edge-to-edge Header */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 12),
            backgroundColor: isDark ? '#121212' : '#ffffff',
            borderBottomColor: isDark ? '#262626' : colors.border,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Calls</Text>
          <ScalePressable
            onPress={handleNewCall}
            accessibilityLabel="Start a new call"
            accessibilityRole="button"
            accessibilityHint="Navigates to contact picker to initiate a call"
            style={[
              styles.headerActionBtn,
              { backgroundColor: isDark ? '#262626' : colors.primarySoft },
            ]}
          >
            <Ionicons name="call" size={18} color={isDark ? '#ffffff' : colors.primary} />
          </ScalePressable>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? '#1a1a1a' : '#f0f4f8',
              borderColor: isDark ? '#333333' : 'transparent',
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={isDark ? 'rgba(255,255,255,0.45)' : colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search calls by name or phone..."
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.45)' : colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Call History Feed */}
      <View style={styles.body}>
        {currentUser ? (
          <RecentCallsList
            currentUserId={currentUser.id}
            searchQuery={searchQuery}
            onSelectConversation={handleSelectConversation}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text style={{ color: colors.placeholder, fontFamily: Typography.fontFamily }}>
              Loading calls...
            </Text>
          </View>
        )}
      </View>
      </View>
    </AnimatedPageWrapper>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.5,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: Typography.fontFamily,
  },
  body: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
