import { useState, useEffect } from 'react';
import type { Contact, UseContactSearchReturn } from './types';
import { searchContactsAndUsers } from './contactSearchService';

export function useContactSearch(): UseContactSearchReturn {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
      searchContactsAndUsers(normalized)
        .then((results) => {
          if (isCancelled) return;
          setSearchResults(results);
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

  return {
    searchValue,
    setSearchValue,
    searchResults,
    setSearchResults,
    isSearching,
    searchError,
    setSearchError,
  };
}
