import { useState, useCallback } from 'react';
import * as Haptics from '../lib/haptics';
import type { Contact, ComposeMode, ComposeStep } from '../components/compose/types';
import { useContactSearch, useGroupCreation } from './compose';

export function useCompose() {
  const [mode, setMode] = useState<ComposeMode>('direct');
  const [step, setStep] = useState<ComposeStep>('members');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    searchValue,
    setSearchValue,
    searchResults,
    setSearchResults,
    isSearching,
    searchError,
  } = useContactSearch();

  const {
    isSubmitting,
    handleStartDirectChat,
    handleCreateGroup,
  } = useGroupCreation({
    groupName,
    selectedContacts,
    onError: setError,
  });

  const handleModeChange = useCallback((newMode: ComposeMode) => {
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
  }, [setSearchValue, setSearchResults]);

  const handleToggleContact = useCallback((contact: Contact) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setSelectedContacts((current) => {
      const exists = current.some((c) => c.userId === contact.userId);
      return exists
        ? current.filter((c) => c.userId !== contact.userId)
        : [...current, contact];
    });
  }, []);

  return {
    mode,
    setMode,
    step,
    setStep,
    searchValue,
    setSearchValue,
    searchResults,
    isSearching,
    searchError,
    selectedContacts,
    groupName,
    setGroupName,
    isSubmitting,
    error,
    setError,
    handleModeChange,
    handleToggleContact,
    handleStartDirectChat,
    handleCreateGroup,
  };
}
