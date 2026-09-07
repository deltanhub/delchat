import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from '../lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithAuth } from '../lib/api-client';
import Colors from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../components/useColorScheme';
import ScalePressable from '../components/ScalePressable';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';

interface Contact {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  mainRole: string;
  subtitle?: string;
}

export default function ComposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [step, setStep] = useState<'members' | 'info'>('members');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search logic matching web
  useEffect(() => {
    const normalized = searchValue.trim();
    if (normalized.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);
    setSearchError(null);

    const delayDebounceFn = setTimeout(() => {
      fetchWithAuth(`/api/chats/contacts?query=${encodeURIComponent(normalized)}`)
        .then((data: { results?: Contact[]; error?: string }) => {
          if (isCancelled) return;
          if (data.error) {
            setSearchError(data.error);
          } else {
            setSearchResults(data.results ?? []);
          }
        })
        .catch(() => {
          if (isCancelled) return;
          setSearchError('Unable to search contacts.');
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearching(false);
          }
        });
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(delayDebounceFn);
    };
  }, [searchValue]);

  // Clean up states when switching modes
  const handleModeChange = (newMode: 'direct' | 'group') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setMode(newMode);
    setSearchValue('');
    setSearchResults([]);
    setSelectedContacts([]);
    setGroupName('');
    setStep('members');
    setError(null);
  };

  const handleToggleContact = (contact: Contact) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setSelectedContacts((current) => {
      const exists = current.some((c) => c.userId === contact.userId);
      if (exists) {
        return current.filter((c) => c.userId !== contact.userId);
      } else {
        return [...current, contact];
      }
    });
  };

  const handleStartDirectChat = async (contact: Contact) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetchWithAuth('/api/chats/direct', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: contact.userId }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const convoId = response.conversation?.id;
      if (convoId) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        router.replace(`/thread/${convoId}`);
      } else {
        throw new Error('No conversation ID returned.');
      }
    } catch (err: any) {
      console.error('[Compose] Error creating direct chat:', err);
      setError(err.message || 'Unable to open the conversation.');
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Group name must be at least 2 characters.');
      return;
    }
    if (selectedContacts.length === 0) {
      setError('At least one group member is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/chats/group', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          userIds: selectedContacts.map((c) => c.userId),
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const convoId = response.conversation?.id;
      if (convoId) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        router.replace(`/thread/${convoId}`);
      } else {
        throw new Error('No conversation ID returned.');
      }
    } catch (err: any) {
      console.error('[Compose] Error creating group chat:', err);
      setError(err.message || 'Unable to create the group.');
      setIsSubmitting(false);
    }
  };

  const renderContactItem = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.some((c) => c.userId === item.userId);

    return (
      <ScalePressable
        onPress={() => {
          if (mode === 'direct') {
            handleStartDirectChat(item);
          } else {
            handleToggleContact(item);
          }
        }}
        style={[
          styles.contactItem,
          {
            backgroundColor: isSelected ? colors.primarySoft : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={styles.contactRow}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.contactAvatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                {item.fullName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.contactDetails}>
            <Text style={[styles.contactName, { color: colors.text }]}>{item.fullName}</Text>
            <Text style={[styles.contactRole, { color: colors.placeholder }]}>
              {item.subtitle || item.mainRole}
            </Text>
          </View>

          {mode === 'group' && (
            <View style={[styles.checkbox, { borderColor: colors.primary }]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              )}
            </View>
          )}
        </View>
      </ScalePressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedPageWrapper>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
          <ScalePressable
            onPress={() => {
              if (step === 'info') {
                setStep('members');
              } else {
                router.back();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name={step === 'info' ? 'arrow-back' : 'chevron-down'} size={24} color={colors.primary} />
          </ScalePressable>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {step === 'members' ? 'New Message' : 'Group Details'}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {isSubmitting && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.submittingText, { color: colors.text }]}>
              {mode === 'direct' ? 'Creating chat thread...' : 'Creating group...'}
            </Text>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
            </View>
          )}

          {step === 'members' ? (
            <View style={{ flex: 1 }}>
              {/* Mode Toggle */}
              <View style={styles.toggleContainer}>
                <ScalePressable
                  onPress={() => handleModeChange('direct')}
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: mode === 'direct' ? colors.primary : 'transparent',
                      borderColor: mode === 'direct' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: mode === 'direct' ? '#ffffff' : colors.text }]}>
                    Direct Chat
                  </Text>
                </ScalePressable>

                <ScalePressable
                  onPress={() => handleModeChange('group')}
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: mode === 'group' ? colors.primary : 'transparent',
                      borderColor: mode === 'group' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: mode === 'group' ? '#ffffff' : colors.text }]}>
                    Group Chat
                  </Text>
                </ScalePressable>
              </View>

              {/* Search Bar - Liquid Glass Materials look */}
              <View style={[
                styles.searchContainer, 
                { 
                  backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.card,
                  borderColor: colors.border
                }
              ]}>
                <Ionicons name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
                <TextInput
                  value={searchValue}
                  onChangeText={setSearchValue}
                  placeholder="Search contacts..."
                  placeholderTextColor={colors.placeholder}
                  style={[styles.searchInput, { color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchValue.length > 0 && (
                  <ScalePressable onPress={() => setSearchValue('')}>
                    <Ionicons name="close-circle" size={18} color={colors.placeholder} />
                  </ScalePressable>
                )}
              </View>

              {/* Horizontal List of Selected Contacts in Group Mode */}
              {mode === 'group' && selectedContacts.length > 0 && (
                <View style={[styles.selectedContainer, { borderBottomColor: colors.border }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedScroll}>
                    {selectedContacts.map((contact) => (
                      <View key={contact.userId} style={styles.selectedBadge}>
                        <View style={styles.badgeAvatarWrapper}>
                          {contact.avatarUrl ? (
                            <Image source={{ uri: contact.avatarUrl }} style={styles.selectedAvatar} />
                          ) : (
                            <View style={[styles.selectedAvatarPlaceholder, { backgroundColor: colors.primaryMuted }]}>
                              <Text style={styles.selectedLetter}>
                                {contact.fullName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <ScalePressable
                            onPress={() => handleToggleContact(contact)}
                            style={[styles.removeBadgeButton, { backgroundColor: colors.primary }]}
                          >
                            <Ionicons name="close" size={10} color="#ffffff" />
                          </ScalePressable>
                        </View>
                        <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={1}>
                          {contact.fullName.split(' ')[0]}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Search Results */}
              {isSearching ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : searchError ? (
                <View style={styles.centerContainer}>
                  <Text style={[styles.infoText, { color: colors.placeholder }]}>{searchError}</Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Ionicons name="people-outline" size={48} color={colors.placeholder} style={{ marginBottom: 12 }} />
                  <Text style={[styles.infoText, { color: colors.placeholder }]}>
                    {searchValue.trim().length < 2
                      ? 'Type at least 2 characters to search contacts'
                      : 'No contacts found'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.userId}
                  renderItem={renderContactItem}
                  contentContainerStyle={styles.listContent}
                  keyboardShouldPersistTaps="handled"
                />
              )}

              {/* Footer action button for Group Mode */}
              {mode === 'group' && selectedContacts.length > 0 && (
                <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
                  <ScalePressable
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      } catch (e) {}
                      setStep('info');
                    }}
                    style={[styles.nextButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.nextButtonText}>Next ({selectedContacts.length})</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                  </ScalePressable>
                </View>
              )}
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.infoScroll} keyboardShouldPersistTaps="handled">
              {/* Group Avatar Preview */}
              <View style={styles.avatarPreviewContainer}>
                <View style={[styles.groupAvatarPreview, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.groupAvatarLetter, { color: colors.primary }]}>
                    {groupName ? groupName.slice(0, 2).toUpperCase() : 'GP'}
                  </Text>
                </View>
                <Text style={[styles.avatarPreviewLabel, { color: colors.placeholder }]}>Group Avatar Preview</Text>
              </View>

              {/* Group Subject Name input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.placeholder }]}>GROUP SUBJECT / NAME</Text>
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="e.g. Sales Team, Marketing Discussion"
                  placeholderTextColor={colors.placeholder}
                  maxLength={60}
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                />
              </View>

              {/* Selected Members Summary */}
              <View style={styles.membersSummaryContainer}>
                <Text style={[styles.inputLabel, { color: colors.placeholder }]}>
                  MEMBERS ({selectedContacts.length})
                </Text>
                <View style={[styles.membersSummaryList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  {selectedContacts.map((contact) => (
                    <View key={contact.userId} style={styles.summaryItem}>
                      {contact.avatarUrl ? (
                        <Image source={{ uri: contact.avatarUrl }} style={styles.summaryAvatar} />
                      ) : (
                        <View style={[styles.summaryAvatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
                          <Text style={[styles.summaryAvatarLetter, { color: colors.primary }]}>
                            {contact.fullName.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.summaryName, { color: colors.text }]} numberOfLines={1}>
                        {contact.fullName}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Submit Group Button */}
              <ScalePressable
                onPress={handleCreateGroup}
                disabled={!groupName.trim() || isSubmitting}
                style={[
                  styles.createGroupButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: !groupName.trim() || isSubmitting ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={styles.createGroupButtonText}>Create Group</Text>
              </ScalePressable>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </AnimatedPageWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    padding: 0,
  },
  selectedContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  selectedScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  selectedBadge: {
    alignItems: 'center',
    width: 60,
  },
  badgeAvatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  selectedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  selectedAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLetter: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  removeBadgeButton: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  selectedName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  contactItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  contactDetails: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  contactRole: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  nextButton: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  infoScroll: {
    padding: 20,
    gap: 20,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    gap: 8,
  },
  groupAvatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarLetter: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  avatarPreviewLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  inputField: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  membersSummaryContainer: {
    gap: 8,
  },
  membersSummaryList: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 180,
    padding: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  summaryAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryAvatarLetter: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  summaryName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginLeft: 10,
    flex: 1,
  },
  createGroupButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  createGroupButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submittingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
});
