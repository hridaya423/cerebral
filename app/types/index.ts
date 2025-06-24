export interface AudioSource {
  id: string;
  type: 'recording' | 'upload' | 'youtube';
  title: string;
  url?: string;
  fileName?: string; 
  duration: number;
  createdAt: Date;
  status: 'processing' | 'ready' | 'error';
  fileSize?: number;
  mimeType?: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface Transcription {
  id: string;
  audioSourceId: string;
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  confidence: number;
  createdAt: Date;
  processingTime?: number;
}

export interface AnalysisResult {
  id: string;
  transcriptionId: string;
  keyNotes: string[];
  summary: {
    brief: string;
    detailed: string;
    comprehensive: string;
  };
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  actionItems?: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextReferences?: string[];
}

export interface ChatSession {
  id: string;
  audioSourceId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagramData {
  id: string;
  transcriptionId: string;
  type: 'flowchart' | 'mindmap' | 'concept' | 'timeline' | 'network';
  title: string;
  mermaidCode: string;
  description: string;
  createdAt: Date;
}



export interface ProcessingStatus {
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  message?: string;
  error?: string;
}

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
}

export interface YouTubeVideoInfo {
  title: string;
  duration: number;
  thumbnailUrl: string;
  description: string;
  author: string;
}

export type SupportedAudioFormat = 'mp3' | 'wav' | 'm4a' | 'ogg' | 'webm';

export interface SearchFilters {
  language?: string;
  minConfidence?: number;
  audioSourceType?: 'recording' | 'upload' | 'youtube';
  timeRange?: {
    start: number;
    end: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SearchResult {
  id: string;
  transcriptionId: string;
  segmentIndex?: number;
  matchedText: string;
  contextText: string;
  startTime?: number;
  endTime?: number;
  confidence: number;
  score: number;
}

export interface SearchQuery {
  query: string;
  type: 'text' | 'time' | 'combined';
  filters: SearchFilters;
  timeRange?: {
    start: number;
    end: number;
  };
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  currentResultIndex: number;
  isSearching: boolean;
  filters: SearchFilters;
  highlightedText: string;
}

  
export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  includeAnalysis: boolean;
  includeSegments: boolean;
  includeTimestamps: boolean;
  includeConfidence: boolean;
  customTitle?: string;
}

export interface ExportResult {
  id: string;
  fileName: string;
  format: ExportFormat;
  fileSize: number;
  createdAt: Date;
  options: ExportOptions;
}

export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'generating' | 'exporting' | 'completed' | 'error';
  progress: number;
  message?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}