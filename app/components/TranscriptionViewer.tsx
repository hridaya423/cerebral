'use client';

import { useState } from 'react';
import { Play, FileText, Clock, Video } from 'lucide-react';
import { Transcription, AudioSource } from '../types';
import { formatDuration } from '../lib/audio-utils';

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
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentTranscription.text}
                  </p>
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
                    {currentTranscription.segments.map((segment, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-2 hover:bg-gray-50 rounded text-sm"
                      >
                        <span className="text-gray-500 font-mono min-w-0 text-xs pt-1">
                          {formatDuration(segment.start)}
                        </span>
                        <span className="flex-1 text-gray-700">{segment.text}</span>
                        <span className="text-xs text-gray-400">
                          {Math.round(segment.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}