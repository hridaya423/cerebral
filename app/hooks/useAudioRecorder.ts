import { useState, useRef, useCallback } from 'react';
import { AudioRecorder } from '../lib/audio-utils';
import { AudioRecorderState } from '../types';

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0,
  });
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const initialize = useCallback(async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }
      await recorderRef.current.initialize();
      return true;
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!recorderRef.current) {
      const initialized = await initialize();
      if (!initialized) return false;
    }

    try {
      recorderRef.current!.start();
      startTimeRef.current = Date.now();
      
      setState(prev => ({ ...prev, isRecording: true, isPaused: false }));
      
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setState(prev => ({ ...prev, duration: elapsed }));
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }, [initialize]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!recorderRef.current) return null;

    try {
      const audioBlob = await recorderRef.current.stop();
      
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false,
        duration: 0 
      }));
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      return audioBlob;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      
      const pausedTime = state.duration;
      startTimeRef.current = Date.now() - (pausedTime * 1000);
      
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setState(prev => ({ ...prev, duration: elapsed }));
      }, 100);
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  }, [state.duration]);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (recorderRef.current) {
      recorderRef.current.cleanup();
      recorderRef.current = null;
    }
    
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      volume: 0,
    });
  }, []);

  const getAnalyser = useCallback((): AnalyserNode | null => {
    return recorderRef.current?.analyserNode || null;
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cleanup,
    getAnalyser,
  };
}