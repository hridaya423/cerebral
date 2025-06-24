'use client';

import { Play, Clock, FileText, Video, Mic, Target } from 'lucide-react';
import Highlighter from 'react-highlight-words';
import { SearchResult, AudioSource, Transcription } from '../types';
import { formatDuration } from '../lib/audio-utils';

interface SearchResultsProps {
  results: SearchResult[];
  currentResultIndex: number;
  searchQuery: string;
  onResultClick: (result: SearchResult, index: number) => void;
  onJumpToTime?: (transcriptionId: string, time: number) => void;
  currentTranscription: Transcription | null;
  currentAudioSource: AudioSource | null;
  className?: string;
}

export default function SearchResults({
  results,
  currentResultIndex,
  searchQuery,
  onResultClick,
  onJumpToTime,
  currentTranscription,
  currentAudioSource,
  className = '',
}: SearchResultsProps) {
  const getSourceIcon = (type: AudioSource['type']) => {
    switch (type) {
      case 'recording':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      case 'upload':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'youtube':
        return <Video className="w-4 h-4 text-red-600" />;
      default:
        return <Mic className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSourceLabel = (type: AudioSource['type']) => {
    switch (type) {
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (results.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-8 text-center ${className}`}>
        <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
        <p className="text-slate-600">
          Try adjusting your search query to find what you&apos;re looking for in the current transcription.
        </p>
      </div>
    );
  }

  if (!currentTranscription || !currentAudioSource) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-8 text-center ${className}`}>
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No transcription available</h3>
        <p className="text-slate-600">
          Process an audio file first to enable search functionality.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Search Results
          </h3>
          <div className="text-sm text-slate-600">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getSourceIcon(currentAudioSource.type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 truncate">
              {currentAudioSource.title}
            </h4>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>{getSourceLabel(currentAudioSource.type)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(currentAudioSource.duration)}
              </span>
              <span>
                {results.length} match{results.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {results.map((result, index) => {
          const isActive = index === currentResultIndex;

          return (
            <div
              key={result.id}
              onClick={() => onResultClick(result, index)}
              className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                isActive ? 'bg-purple-50 border-l-4 border-purple-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {result.startTime !== undefined && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onJumpToTime && result.startTime !== undefined) {
                            onJumpToTime(currentTranscription.id, result.startTime);
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        {formatTime(result.startTime)}
                      </button>
                    )}
                    
                                         {result.score !== undefined && (
                       <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRelevanceColor(result.score)}`}>
                         {Math.round(result.score * 100)}% match
                       </span>
                     )}
                   </div>

                   <div className="text-sm text-slate-700 leading-relaxed">
                     <Highlighter
                       searchWords={[searchQuery]}
                       textToHighlight={result.contextText}
                       highlightClassName="bg-yellow-200 font-medium"
                       className="block"
                     />
                   </div>

                  {result.segmentIndex !== undefined && (
                    <div className="mt-2 text-xs text-slate-500">
                      Segment {result.segmentIndex + 1}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}