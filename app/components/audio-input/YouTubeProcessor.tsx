'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Video, ExternalLink, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { YouTubeVideoInfo } from '../../types';
import { formatDuration } from '../../lib/audio-utils';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface YouTubeProcessorProps {
  onVideoSelect: (url: string, videoInfo: YouTubeVideoInfo) => void;
  disabled?: boolean;
}

export default function YouTubeProcessor({ onVideoSelect, disabled = false }: YouTubeProcessorProps) {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;
    
    setError(null);
    setVideoInfo(null);
    setIsLoading(true);

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid YouTube URL');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/youtube-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get video information');
      }

      const result = await response.json();
      setVideoInfo(result.videoInfo);
      onVideoSelect(url.trim(), result.videoInfo);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearVideo = () => {
    setUrl('');
    setVideoInfo(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <Card className="p-4 sm:p-8">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-red-100 to-red-200 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg">
          <Video className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">YouTube Video</h3>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm font-medium transition-all duration-200"
              disabled={disabled || isLoading}
            />
            <Button
              type="submit"
              disabled={disabled || isLoading || !url.trim()}
              variant="danger"
              size="md"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Process
                </>
              )}
            </Button>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-600 font-medium text-center">
              Supports youtube.com and youtu.be URLs • Maximum 30 minutes
            </p>
          </div>
        </form>

        {isLoading && (
          <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-cyan-50/50 p-6 rounded-xl border border-blue-200/50">
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200" />
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent absolute top-0 left-0" />
            </div>
            <span className="text-base font-semibold text-blue-700">Getting video information...</span>
            <div className="flex gap-1 ml-auto">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50/50 p-6 rounded-xl border border-red-200/50 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-red-800 mb-2">Error</p>
                <p className="text-base text-red-700 font-medium mb-3">{error}</p>
                <button
                  onClick={clearVideo}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {videoInfo && !isLoading && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 p-6 rounded-xl border border-green-200/50 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-green-800 mb-3 text-lg leading-tight">
                  {videoInfo.title}
                </h4>
                
                <div className="space-y-2 text-base text-green-700">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 w-5 h-5 rounded-lg flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold">{videoInfo.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 w-5 h-5 rounded-lg flex items-center justify-center">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold">{formatDuration(videoInfo.duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={clearVideo}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Process different video
                  </button>
                  
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/60 hover:bg-white/80 text-green-700 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md border border-green-200/50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on YouTube
                  </a>
                </div>
              </div>

              {videoInfo.thumbnailUrl && (
                <div className="relative flex-shrink-0">
                  <Image
                    src={videoInfo.thumbnailUrl}
                    alt="Video thumbnail"
                    width={120}
                    height={90}
                    className="w-30 h-22 object-cover rounded-xl shadow-lg border border-green-200/50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent rounded-xl" />
                </div>
              )}
            </div>
          </div>
        )}

        {!videoInfo && !error && !isLoading && (
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-6 rounded-xl border border-slate-200/50">
            <p className="text-slate-700 font-semibold text-center mb-2">Paste a YouTube URL to extract and transcribe the audio content.</p>
            <p className="text-sm text-slate-600 font-medium text-center">Perfect for lectures, podcasts, interviews, and educational content.</p>
          </div>
        )}
      </div>
    </Card>
  );
}