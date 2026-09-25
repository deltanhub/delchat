import React from 'react';
import { StyleSheet, View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from '../lib/haptics';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';
import { useCompose } from '../hooks/useCompose';
import {
  ComposeHeader, ComposeModeToggle, ComposeSearchBar, ComposeSelectedChips,
  ComposeContactCard, ComposeGroupInfoView, ComposeEmptyState, ComposeFooter, ComposeStatusOverlay,
} from '../components/compose';

export default function ComposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    mode, step, setStep, searchValue, setSearchValue, searchResults,
    isSearching, searchError, selectedContacts, groupName, setGroupName,
    isSubmitting, error, handleModeChange, handleToggleContact,
    handleStartDirectChat, handleCreateGroup,
  } = useCompose();

  const handleBack = () => {
    if (step === 'info') setStep('members');
    else router.back();
  };

  const handleNextToInfo = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setStep('info');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AnimatedPageWrapper>
        <ComposeHeader
          step={step}
          isDark={isDark}
          colors={colors}
          topInset={insets.top}
          onBack={handleBack}
        />

        <ComposeStatusOverlay
          isSubmitting={isSubmitting}
          mode={mode}
          error={error}
          colors={colors}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexOne}
        >
          {step === 'members' ? (
            <View style={styles.flexOne}>
              <ComposeModeToggle mode={mode} onModeChange={handleModeChange} colors={colors} isDark={isDark} />
              <ComposeSearchBar
                value={searchValue}
                onChangeText={setSearchValue}
                isDark={isDark}
                colors={colors}
                placeholder={mode === 'direct' ? 'Search by username, name, or email...' : 'Search people to add...'}
              />

              {mode === 'group' && (
                <ComposeSelectedChips
                  selectedContacts={selectedContacts}
                  onRemoveContact={handleToggleContact}
                  colors={colors}
                />
              )}

              {isSearching || searchError || searchResults.length === 0 ? (
                <ComposeEmptyState
                  isSearching={isSearching}
                  searchError={searchError}
                  searchValue={searchValue}
                  colors={colors}
                />
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.userId}
                  contentContainerStyle={styles.listContent}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <ComposeContactCard
                      contact={item}
                      mode={mode}
                      isSelected={selectedContacts.some((c) => c.userId === item.userId)}
                      colors={colors}
                      onPress={() => (mode === 'direct' ? handleStartDirectChat(item) : handleToggleContact(item))}
                    />
                  )}
                />
              )}

              {mode === 'group' && (
                <ComposeFooter
                  selectedCount={selectedContacts.length}
                  bottomInset={insets.bottom}
                  colors={colors}
                  onNext={handleNextToInfo}
                />
              )}
            </View>
          ) : (
            <ComposeGroupInfoView
              groupName={groupName}
              onChangeGroupName={setGroupName}
              selectedContacts={selectedContacts}
              isSubmitting={isSubmitting}
              colors={colors}
              onCreateGroup={handleCreateGroup}
            />
          )}
        </KeyboardAvoidingView>
      </AnimatedPageWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexOne: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
});
