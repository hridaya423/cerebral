'use client';

import { useState, useEffect } from 'react';
import { Mic, Play, Pause, Square, Download } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { formatDuration } from '../../lib/audio-utils';
import AudioWaveform from '../ui/AudioWaveform';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface LiveRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => Promise<void>;
  disabled?: boolean;
}

export default function LiveRecorder({ onRecordingComplete, disabled = false }: LiveRecorderProps) {
  const { state, startRecording, stopRecording, pauseRecording, resumeRecording, cleanup, getAnalyser } = useAudioRecorder();
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleStartRecording = async () => {
    setRecordedBlob(null);
    const success = await startRecording();
    if (!success) {
      alert('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (blob) {
      setRecordedBlob(blob);
      setRecordedDuration(state.duration);
      await onRecordingComplete(blob, state.duration);
    }
  };

  const handlePauseResume = () => {
    if (state.isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().split('T')[0]}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="p-4 sm:p-8">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-red-100 to-red-200 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg">
          <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Live Recording</h3>
      </div>

      <div className="space-y-4">
        <hr className="border-slate-200" />
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
              onClick={handleStartRecording}
            disabled={disabled || state.isRecording}
              variant="danger"
              size="md"
            >
              <Mic className="w-4 h-4" />
            <span className="text-sm sm:text-base">Start</span>
          </Button>

          <Button
                onClick={handlePauseResume}
            disabled={disabled || !state.isRecording}
                variant="warning"
                size="md"
              >
                {state.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span className="text-sm sm:text-base">{state.isPaused ? 'Resume' : 'Pause'}</span>
          </Button>
          <Button
                onClick={handleStopRecording}
            disabled={disabled || !state.isRecording}
            variant="success"
                size="md"
              >
                <Square className="w-4 h-4" />
                <span className="text-sm sm:text-base">Stop</span>
          </Button>

          {recordedBlob && (
            <Button
              onClick={downloadRecording}
              variant="success"
              size="md"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm sm:text-base">Download</span>
            </Button>
          )}
        </div>

        {state.isRecording && (
          <div className="space-y-4">
            <AudioWaveform 
              analyser={getAnalyser()} 
              isRecording={state.isRecording} 
              isPaused={state.isPaused}
              className="h-24"
            />
            
            <div className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-blue-50/50 p-4 rounded-xl border border-slate-200/50">
              <div className={`w-4 h-4 rounded-full shadow-lg ${state.isPaused ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse'}`} />
              <span className="text-base font-bold text-slate-800">
                {state.isPaused ? 'Paused' : 'Recording'}: {formatDuration(state.duration)}
              </span>
              <div className="flex gap-1 ml-auto">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      state.isPaused ? 'bg-yellow-400' : 'bg-red-400 animate-pulse'
                    }`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {recordedBlob && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 p-6 rounded-xl border border-green-200/50 shadow-sm">
            <div className="flex items-center gap-4 text-green-900">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-6 h-6 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-base font-bold">
                Recording complete ({formatDuration(recordedDuration)})
              </span>
              <div className="flex gap-1 ml-auto">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!state.isRecording && !recordedBlob && (
          <div className="bg-slate-50 p-4 sm:p-6 rounded-lg border border-slate-200">
            <p className="text-slate-700 font-medium text-center mb-2 text-sm sm:text-base">Click &quot;Start Recording&quot; to begin capturing audio from your microphone.</p>
            <p className="text-xs sm:text-sm text-slate-600 font-medium text-center">You can pause and resume recording as needed for optimal flexibility.</p>
          </div>
        )}
      </div>
    </Card>
  );
}