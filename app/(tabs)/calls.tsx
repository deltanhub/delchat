import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import * as Haptics from '../../lib/haptics';
import RecentCallsList from '../../components/chat/RecentCallsList';
import { CallsHeader, callsScreenStyles as styles } from '../../components/chat/recent_calls';

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

        <CallsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewCall={handleNewCall}
          topInset={insets.top}
          isDark={isDark}
          colors={colors}
        />

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
