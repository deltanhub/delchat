import type { Contact, ComposeMode, ComposeStep } from '../../components/compose/types';

export type { Contact, ComposeMode, ComposeStep };

export interface ContactSearchResult {
  results?: Contact[];
  error?: string;
}

export interface UseContactSearchReturn {
  searchValue: string;
  setSearchValue: (val: string) => void;
  searchResults: Contact[];
  setSearchResults: (results: Contact[]) => void;
  isSearching: boolean;
  searchError: string | null;
  setSearchError: (err: string | null) => void;
}

export interface UseGroupCreationParams {
  groupName: string;
  selectedContacts: Contact[];
  onError: (err: string | null) => void;
}

export interface UseGroupCreationReturn {
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  handleStartDirectChat: (contact: Contact) => Promise<void>;
  handleCreateGroup: () => Promise<void>;
}
