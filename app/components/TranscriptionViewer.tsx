/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, FileText, Clock, Video, Search } from 'lucide-react';
import Highlighter from 'react-highlight-words';
import { Transcription, AudioSource, SearchResult } from '../types';
import { formatDuration } from '../lib/audio-utils';
import { useSearch } from '../hooks/useSearch';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';

interface TranscriptionViewerProps {
  transcription: Transcription;
  audioSource: AudioSource;
  onTranscriptionUpdate?: (updatedTranscription: Transcription) => void;
}

export default function TranscriptionViewer({ 
  transcription, 
  audioSource, 
  onTranscriptionUpdate 
}: TranscriptionViewerProps) {
  const [currentTranscription, setCurrentTranscription] = useState(transcription);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription.text);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedSegmentIndex, setHighlightedSegmentIndex] = useState<number | null>(null);
  
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    searchState,
    searchStats,
    searchInTranscription,
    navigateResults,
    clearSearch,  
  } = useSearch();

  const handleTranscriptionUpdate = (updatedTranscription: Transcription) => {
    setCurrentTranscription(updatedTranscription);
    onTranscriptionUpdate?.(updatedTranscription);
  };

  const handleSave = () => {
    const updatedTranscription = {
      ...currentTranscription,
      text: editedText
    };
    handleTranscriptionUpdate(updatedTranscription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(currentTranscription.text);
    setIsEditing(false);
  };

  const handleSearch = (query: string, filters = {}) => {
    const results = searchInTranscription(currentTranscription, query, filters);
    if (results.length > 0) {
      setShowSearch(true);
      scrollToSegment(results[0].segmentIndex || 0);
    }
  };

  const handleTimeSearch = (startTime: number, endTime: number) => {
    const matchingSegments = currentTranscription.segments.filter(
      segment => segment.start >= startTime && segment.end <= endTime
    );
    
    if (matchingSegments.length > 0) {
      const firstSegmentIndex = currentTranscription.segments.indexOf(matchingSegments[0]);
      scrollToSegment(firstSegmentIndex);
      setHighlightedSegmentIndex(firstSegmentIndex);
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.segmentIndex !== undefined) {
      scrollToSegment(result.segmentIndex);
      setHighlightedSegmentIndex(result.segmentIndex);
    }
  };

  const scrollToSegment = (segmentIndex: number) => {
    const segmentElement = segmentRefs.current[segmentIndex];
    if (segmentElement) {
      segmentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      setHighlightedSegmentIndex(segmentIndex);
      
      setTimeout(() => {
        setHighlightedSegmentIndex(null);
      }, 3000);
    }
  };

  const handleClearSearch = () => {
    clearSearch();
    setShowSearch(false);
    setHighlightedSegmentIndex(null);
  };

  useEffect(() => {
    if (searchState.results.length > 0 && searchState.currentResultIndex >= 0) {
      const currentResult = searchState.results[searchState.currentResultIndex];
      if (currentResult && currentResult.segmentIndex !== undefined) {
        scrollToSegment(currentResult.segmentIndex);
      }
    }
  }, [searchState.results, searchState.currentResultIndex]);

  const getSourceIcon = () => {
    switch (audioSource.type) {
      case 'recording':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      case 'upload':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'youtube':
        return <Video className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSourceLabel = () => {
    switch (audioSource.type) {
      case 'recording':
        return 'Live Recording';
      case 'upload':
        return 'Audio File';
      case 'youtube':
        return 'YouTube Video';
      default:
        return 'Audio Source';
    }
  };

  return (
    <div className="space-y-4">
      <SearchBar
        onSearch={handleSearch}
        onTimeSearch={handleTimeSearch}
        onClear={handleClearSearch}
        isSearching={searchState.isSearching}
        searchStats={searchStats}
        onNavigate={navigateResults}
        placeholder="Search in this transcription..."
      />

      {showSearch && searchState.results.length > 0 && (
        <SearchResults
          results={searchState.results}
          currentResultIndex={searchState.currentResultIndex}
          searchQuery={searchState.query}
          onResultClick={(result, _index) => handleSearchResultClick(result)}
          onJumpToTime={(transcriptionId, time) => {
            const segmentIndex = currentTranscription.segments.findIndex(
              segment => segment.start <= time && segment.end >= time
            );
            if (segmentIndex !== -1) {
              scrollToSegment(segmentIndex);
            }
          }}
          currentTranscription={currentTranscription}
          currentAudioSource={audioSource}
          className="max-h-64"
        />
      )}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {getSourceIcon()}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {audioSource.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  {getSourceLabel()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(audioSource.duration)}
                </span>
                {searchState.results.length > 0 && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <Search className="w-3 h-3" />
                    {searchState.results.length} match{searchState.results.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

      <div className="p-4">
        <div className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Transcription
                </label>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Edit your transcription..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-md font-medium mb-3">Transcription</h3>
                <div className="prose max-w-none">
                  {searchState.highlightedText ? (
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      <Highlighter
                        searchWords={[searchState.highlightedText]}
                        textToHighlight={currentTranscription.text}
                        highlightClassName="bg-yellow-200 font-medium rounded px-1"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {currentTranscription.text}
                    </p>
                  )}
                </div>
              </div>

        
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-4 border-t">
                <span>
                  Language: <span className="font-medium">{currentTranscription.language}</span>
                </span>
                <span>
                  Confidence: <span className="font-medium">{Math.round(currentTranscription.confidence * 100)}%</span>
                </span>
                {currentTranscription.processingTime && (
                  <span>
                    Processing: <span className="font-medium">{currentTranscription.processingTime}ms</span>
                  </span>
                )}
                <span>
                  Created: <span className="font-medium">{currentTranscription.createdAt.toLocaleDateString()}</span>
                </span>
              </div>

              {currentTranscription.segments && currentTranscription.segments.length > 0 && !isEditing && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-md font-medium mb-3">Transcript Segments</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentTranscription.segments.map((segment, index) => {
                      const isHighlighted = highlightedSegmentIndex === index;
                      const hasSearchMatch = searchState.results.some(
                        (result: SearchResult) => result.segmentIndex === index
                      );

                      return (
                        <div
                          key={index}
                          ref={(el) => { segmentRefs.current[index] = el; }}
                          className={`flex gap-3 p-2 rounded text-sm transition-colors cursor-pointer ${
                            isHighlighted
                              ? 'bg-purple-100 ring-2 ring-purple-500'
                              : hasSearchMatch
                              ? 'bg-yellow-50 hover:bg-yellow-100'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => scrollToSegment(index)}
                        >
                          <span className="text-gray-500 font-mono min-w-0 text-xs pt-1">
                            {formatDuration(segment.start)}
                          </span>
                          <span className="flex-1 text-gray-700">
                            {searchState.highlightedText ? (
                              <Highlighter
                                searchWords={[searchState.highlightedText]}
                                textToHighlight={segment.text}
                                highlightClassName="bg-yellow-200 font-medium rounded px-1"
                              />
                            ) : (
                              segment.text
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasSearchMatch && (
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            )}
                            <span className="text-xs text-gray-400">
                              {Math.round(segment.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}