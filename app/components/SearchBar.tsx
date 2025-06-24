'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { SearchFilters } from '../types';

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onTimeSearch?: (startTime: number, endTime: number) => void;
  onClear: () => void;
  isSearching?: boolean;
  searchStats?: {
    totalResults: number;
    currentIndex: number;
    hasResults: boolean;
    isFirstResult: boolean;
    isLastResult: boolean;
  };
  onNavigate?: (direction: 'next' | 'prev') => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  onTimeSearch,
  onClear,
  isSearching = false,
  searchStats,
  onNavigate,
  placeholder = "Search transcriptions...",
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTimeSearch, setShowTimeSearch] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({} as SearchFilters);
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), filters);
    } else {
      onClear();
    }
  };

  const handleTimeSearch = () => {
    if (timeRange.start && timeRange.end && onTimeSearch) {
      const startSeconds = parseTimeString(timeRange.start);
      const endSeconds = parseTimeString(timeRange.end);
      
      if (startSeconds !== null && endSeconds !== null && startSeconds < endSeconds) {
        onTimeSearch(startSeconds, endSeconds);
        setShowTimeSearch(false);
      }
    }
  };

  const parseTimeString = (timeStr: string): number | null => {
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    
    if (parts.length === 1 && !isNaN(parts[0])) {
      return parts[0];
    } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    
    return null;
  };

  const handleClear = () => {
    setQuery('');
    setFilters({} as SearchFilters);
    setTimeRange({ start: '', end: '' });
    onClear();
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (query.trim()) {
      onSearch(query, updatedFilters);
    }
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof SearchFilters] !== undefined && 
    filters[key as keyof SearchFilters] !== ''
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
        <div className="flex items-center flex-1">
          <div className="pl-4 pr-2">
            <Search className={`w-5 h-5 ${isSearching ? 'text-purple-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              } else if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder={placeholder}
            className="flex-1 py-3 px-2 text-slate-900 placeholder-slate-500 bg-transparent border-none outline-none"
          />
        </div>

        {searchStats?.hasResults && (
          <div className="flex items-center gap-1 px-2 border-l border-slate-200">
            <span className="text-sm text-slate-600 font-medium min-w-0">
              {searchStats.currentIndex + 1} of {searchStats.totalResults}
            </span>
            
            <button
              onClick={() => onNavigate?.('prev')}
              disabled={searchStats.isFirstResult}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous result (Ctrl+↑)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onNavigate?.('next')}
              disabled={searchStats.isLastResult}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next result (Ctrl+↓)"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => setShowTimeSearch(!showTimeSearch)}
            className={`p-2 rounded-md transition-colors ${
              showTimeSearch 
                ? 'bg-purple-100 text-purple-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Time-based search"
          >
            <Clock className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-colors relative ${
              showFilters || hasActiveFilters
                ? 'bg-purple-100 text-purple-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Search filters"
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
            )}
          </button>

          {query && (
            <button
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Clear search (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showTimeSearch && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Search by Time Range</h3>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-600 mb-1">Start Time</label>
              <input
                type="text"
                value={timeRange.start}
                onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                placeholder="0:00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-xs text-slate-600 mb-1">End Time</label>
              <input
                type="text"
                value={timeRange.end}
                onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                placeholder="1:30"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="pt-5">
              <button
                onClick={handleTimeSearch}
                disabled={!timeRange.start || !timeRange.end}
                className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Search
              </button>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            Use formats like &quot;1:30&quot; (1 minute 30 seconds) or &quot;90&quot; (90 seconds)
          </p>
        </div>
      )}

      {showFilters && (
        <div ref={filtersRef} className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Search Filters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Audio Source Type</label>
              <select
                value={filters.audioSourceType || ''}
                onChange={(e) => handleFilterChange({ 
                  audioSourceType: e.target.value as 'recording' | 'upload' | 'youtube' | undefined 
                })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All types</option>
                <option value="recording">Live Recording</option>
                <option value="upload">File Upload</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Minimum Confidence: {filters.minConfidence ? `${Math.round(filters.minConfidence * 100)}%` : 'Any'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.minConfidence || 0}
                onChange={(e) => handleFilterChange({ minConfidence: parseFloat(e.target.value) || undefined })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Language</label>
              <select
                value={filters.language || ''}
                onChange={(e) => handleFilterChange({ language: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All languages</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setFilters({} as SearchFilters);
                if (query.trim()) {
                  onSearch(query, {} as SearchFilters);
                }
              }}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Clear Filters
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(false)}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (query.trim()) {
                    onSearch(query, filters);
                  }
                  setShowFilters(false);
                }}
                className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    
      {query && (
        <div className="absolute top-full right-0 mt-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Esc</kbd>
              clear
            </span>
          </div>
        </div>
      )}
    </div>
  );
}