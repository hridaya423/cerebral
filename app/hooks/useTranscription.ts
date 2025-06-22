import { useState, useCallback } from 'react';
import { ProcessingStatus } from '../types';

export function useTranscription() {
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'completed',
    progress: 0,
  });

  const transcribeFile = useCallback(async (file: File, language = 'en') => {
    setStatus({ stage: 'transcribing', progress: 10 });

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('language', language);

      setStatus({ stage: 'transcribing', progress: 50 });

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const result = await response.json();
      setStatus({ stage: 'completed', progress: 100 });

      return result.transcription;
    } catch (error) {
      setStatus({ 
        stage: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, []);

  const transcribeYouTube = useCallback(async (url: string, language = 'en') => {
    setStatus({ stage: 'uploading', progress: 10 });

    try {
      const infoResponse = await fetch('/api/youtube-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language }),
      });

      if (!infoResponse.ok) {
        const error = await infoResponse.json();
        throw new Error(error.error || 'Failed to get video info');
      }

      setStatus({ stage: 'transcribing', progress: 30 });
        
      const transcribeResponse = await fetch('/api/youtube-extract', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language }),
      });

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || 'Transcription failed');
      }

      setStatus({ stage: 'transcribing', progress: 80 });

      const result = await transcribeResponse.json();
      setStatus({ stage: 'completed', progress: 100 });

      return {
        transcription: result.transcription,
        videoInfo: (await infoResponse.json()).videoInfo,
      };
    } catch (error) {
      setStatus({ 
        stage: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, []);

  const analyzeText = useCallback(async (text: string) => {
    setStatus({ stage: 'analyzing', progress: 20 });

    try {
      const response = await fetch('/api/analyze', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await response.json();
      setStatus({ stage: 'completed', progress: 100 });

      return result.analysis;
    } catch (error) {
      setStatus({ 
        stage: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, []);

  const generateDiagram = useCallback(async (text: string, diagramType: string) => {
    setStatus({ stage: 'analyzing', progress: 30 });

    try {
      const response = await fetch('/api/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, diagramType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Diagram generation failed');
      }

      const result = await response.json();
      setStatus({ stage: 'completed', progress: 100 });

      return result.diagram;
    } catch (error) {
      setStatus({ 
        stage: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus({ stage: 'completed', progress: 0 });
  }, []);

  return {
    status,
    transcribeFile,
    transcribeYouTube,
    analyzeText,
    generateDiagram,
    reset,
  };
}