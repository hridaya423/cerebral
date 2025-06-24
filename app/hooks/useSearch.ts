import { useState, useCallback, useMemo } from 'react';
import { 
  SearchQuery, 
  SearchFilters, 
  SearchState, 
  Transcription 
} from '../types';
import { SearchUtils } from '../lib/search-export-utils';

export function useSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    currentResultIndex: -1,
    isSearching: false,
    filters: {},
    highlightedText: '',
  });

  const performSearch = useCallback(
    async (query: string, transcription: Transcription | null, filters: SearchFilters = {}) => {
      if (!query.trim() || !transcription) {
        setSearchState((prev: SearchState) => ({
          ...prev,
          query: '',
          results: [],
          currentResultIndex: -1,
          highlightedText: '',
        }));
        return;
      }

      setSearchState((prev: SearchState) => ({ ...prev, isSearching: true }));

      try {
        const results = SearchUtils.searchInTranscription(transcription, query, filters);

        setSearchState((prev: SearchState) => ({
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
        setSearchState((prev: SearchState) => ({
          ...prev,
          isSearching: false,
          results: [],
          currentResultIndex: -1,
        }));
      }
    },
    []
  );

  const searchInTranscription = useCallback(
    (transcription: Transcription, query: string, filters: SearchFilters = {}) => {
      if (!query.trim()) return [];
      
      return SearchUtils.searchInTranscription(transcription, query, filters);
    },
    []
  );

  const searchByTime = useCallback(
    (startTime: number, endTime: number, transcription: Transcription | null) => {
      if (!transcription) {
        return [];
      }

      setSearchState((prev: SearchState) => ({ ...prev, isSearching: true }));

      try {
        const results = SearchUtils.searchByTimeRange(transcription, startTime, endTime);

        setSearchState((prev: SearchState) => ({
          ...prev,
          results,
          currentResultIndex: results.length > 0 ? 0 : -1,
          isSearching: false,
          query: `Time: ${formatTime(startTime)} - ${formatTime(endTime)}`,
        }));

        return results;
      } catch (error) {
        console.error('Time search error:', error);
        setSearchState((prev: SearchState) => ({
          ...prev,
          isSearching: false,
          results: [],
          currentResultIndex: -1,
        }));
        return [];
      }
    },
    []
  );

  const navigateResults = useCallback((direction: 'next' | 'prev') => {
    setSearchState((prev: SearchState) => {
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
    setSearchState((prev: SearchState) => ({
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

  const updateFilters = useCallback((newFilters: SearchFilters, transcription: Transcription | null) => {
    setSearchState((prev: SearchState) => ({ ...prev, filters: newFilters }));
    
    if (searchState.query && transcription) {
      performSearch(searchState.query, transcription, newFilters);
    }
  }, [searchState.query, performSearch]);

  const advancedSearch = useCallback(
    (searchQuery: SearchQuery, transcription: Transcription | null) => {
      if (!transcription) {
        return [];
      }

      setSearchState((prev: SearchState) => ({ ...prev, isSearching: true }));

      try {
        const results = SearchUtils.searchInTranscription(transcription, searchQuery.query, searchQuery.filters);

        setSearchState((prev: SearchState) => ({
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
        setSearchState((prev: SearchState) => ({
          ...prev,
          isSearching: false,
          results: [],
          currentResultIndex: -1,
        }));
        return [];
      }
    },
    []
  );

  const searchStats = useMemo(() => {
    const hasResults = searchState.results.length > 0;
    const currentIndex = searchState.currentResultIndex;
    
    return {
      totalResults: searchState.results.length,
      currentIndex: hasResults ? currentIndex : -1,
      hasResults,
      isFirstResult: currentIndex <= 0,
      isLastResult: currentIndex >= searchState.results.length - 1,
    };
  }, [searchState.results.length, searchState.currentResultIndex]);

  return {
    searchState,
    searchStats,
    performSearch,
    searchInTranscription,
    searchByTime,
    navigateResults,
    jumpToResult,
    clearSearch,
    updateFilters,
    advancedSearch,
  };
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}