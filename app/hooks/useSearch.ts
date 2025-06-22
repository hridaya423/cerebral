import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  SearchResult, 
  SearchQuery, 
  SearchFilters, 
  SearchState, 
  Transcription 
} from '../types';
import { SearchUtils } from '../lib/search-export-utils';
import { LocalStorage } from '../lib/storage';

export function useSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    currentResultIndex: -1,
    isSearching: false,
    filters: {},
    highlightedText: '',
  });

  const transcriptions = useMemo(() => {
    return LocalStorage.getTranscriptions();
  }, []);

  const performSearch = useCallback(
    async (query: string, filters: SearchFilters = {}) => {
      if (!query.trim()) {
        setSearchState(prev => ({
          ...prev,
          query: '',
          results: [],
          currentResultIndex: -1,
          highlightedText: '',
        }));
        return;
      }

      setSearchState(prev => ({ ...prev, isSearching: true }));

      try {
        const searchQuery: SearchQuery = {
          query: query.trim(),
          type: 'text', 
          filters,
        };

        const results = SearchUtils.searchMultipleTranscriptions(transcriptions, searchQuery);

        setSearchState(prev => ({
          ...prev,
          query,
          results,
          currentResultIndex: results.length > 0 ? 0 : -1,
          isSearching: false,
          filters,
          highlightedText: query,
        }));
      } catch (error) {
        console.error('Search error:', error);
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          results: [],
          currentResultIndex: -1,
        }));
      }
    },
    [transcriptions]
  );

  const searchInTranscription = useCallback(
    (transcription: Transcription, query: string, filters: SearchFilters = {}) => {
      if (!query.trim()) return [];
      
      return SearchUtils.searchInTranscription(transcription, query, filters);
    },
    []
  );

  const searchByTime = useCallback(
    (startTime: number, endTime: number, transcriptionId?: string) => {
      setSearchState(prev => ({ ...prev, isSearching: true }));

      try {
        let results: SearchResult[] = [];

        if (transcriptionId) {
          const transcription = transcriptions.find(t => t.id === transcriptionId);
          if (transcription) {
            results = SearchUtils.searchByTimeRange(transcription, startTime, endTime);
          }
        } else {
          transcriptions.forEach(transcription => {
            const timeResults = SearchUtils.searchByTimeRange(transcription, startTime, endTime);
            results = [...results, ...timeResults];
          });
        }

        setSearchState(prev => ({
          ...prev,
          results,
          currentResultIndex: results.length > 0 ? 0 : -1,
          isSearching: false,
          query: `Time: ${formatTime(startTime)} - ${formatTime(endTime)}`,
        }));

        return results;
      } catch (error) {
        console.error('Time search error:', error);
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          results: [],
          currentResultIndex: -1,
        }));
        return [];
      }
    },
    [transcriptions]
  );

  const navigateResults = useCallback((direction: 'next' | 'prev') => {
    setSearchState(prev => {
      if (prev.results.length === 0) return prev;

      let newIndex = prev.currentResultIndex;
      
      if (direction === 'next') {
        newIndex = (prev.currentResultIndex + 1) % prev.results.length;
      } else {
        newIndex = prev.currentResultIndex <= 0 
          ? prev.results.length - 1 
          : prev.currentResultIndex - 1;
      }

      return {
        ...prev,
        currentResultIndex: newIndex,
      };
    });
  }, []);

  const jumpToResult = useCallback((index: number) => {
    setSearchState(prev => ({
      ...prev,
      currentResultIndex: Math.max(0, Math.min(index, prev.results.length - 1)),
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      results: [],
      currentResultIndex: -1,
      isSearching: false,
      filters: {},
      highlightedText: '',
    });
  }, []);

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setSearchState(prev => ({ ...prev, filters: newFilters }));
    
    if (searchState.query) {
      performSearch(searchState.query, newFilters);
    }
  }, [searchState.query, performSearch]);

  const advancedSearch = useCallback(
    (searchQuery: SearchQuery) => {
      setSearchState(prev => ({ ...prev, isSearching: true }));

      try {
        const results = SearchUtils.searchMultipleTranscriptions(transcriptions, searchQuery);

        setSearchState(prev => ({
          ...prev,
          query: searchQuery.query,
          results,
          currentResultIndex: results.length > 0 ? 0 : -1,
          isSearching: false,
          filters: searchQuery.filters,
          highlightedText: searchQuery.query,
        }));

        return results;
      } catch (error) {
        console.error('Advanced search error:', error);
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          results: [],
          currentResultIndex: -1,
        }));
        return [];
      }
    },
    [transcriptions]
  );

  const getHighlightedText = useCallback(
    (text: string) => {
      if (!searchState.highlightedText) return text;
      return SearchUtils.highlightText(text, searchState.highlightedText);
    },
    [searchState.highlightedText]
  );

  const currentResult = useMemo(() => {
    if (searchState.currentResultIndex >= 0 && searchState.results.length > 0) {
      return searchState.results[searchState.currentResultIndex];
    }
    return null;
  }, [searchState.currentResultIndex, searchState.results]);

  const searchStats = useMemo(() => {
    return {
      totalResults: searchState.results.length,
      currentIndex: searchState.currentResultIndex,
      hasResults: searchState.results.length > 0,
      isFirstResult: searchState.currentResultIndex === 0,
      isLastResult: searchState.currentResultIndex === searchState.results.length - 1,
    };
  }, [searchState.results.length, searchState.currentResultIndex]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!searchState.query || searchState.results.length === 0) return;

    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'ArrowDown':
        case 'j': 
          event.preventDefault();
          navigateResults('next');
          break;
        case 'ArrowUp':
        case 'k': 
          event.preventDefault();
          navigateResults('prev');
          break;
        case 'Escape':
          event.preventDefault();
          clearSearch();
          break;
      }
    }
  }, [searchState.query, searchState.results.length, navigateResults, clearSearch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    searchState,
    currentResult,
    searchStats,
    
    performSearch,
    searchInTranscription,
    searchByTime,
    advancedSearch,
    navigateResults,
    jumpToResult,
    clearSearch,
    updateFilters,
    getHighlightedText,
  };
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}