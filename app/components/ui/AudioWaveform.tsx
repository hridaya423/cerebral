'use client';

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
  isPaused: boolean;
  className?: string;
}

export default function AudioWaveform({ analyser, isRecording, isPaused, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current || !isRecording || isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)'); 
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.6)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
      ctx.lineWidth = 1;

      const barWidth = width / bufferLength * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8;
        
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
      ctx.lineWidth = 2;
      
      const sliceWidth = width / bufferLength;
      x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [analyser, isRecording, isPaused]);

  useEffect(() => {
    if ((!isRecording || isPaused) && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (isPaused) {
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)'; 
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
    }
  }, [isRecording, isPaused]);

  return (
    <div className={`relative bg-slate-50 rounded-lg border border-slate-200 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80">
          <span className="text-sm font-medium text-slate-500">Audio visualization will appear here during recording</span>
        </div>
      )}
      {isRecording && isPaused && (
        <div className="absolute top-2 right-2">
          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium">
            PAUSED
          </div>
        </div>
      )}
      {isRecording && !isPaused && (
        <div className="absolute top-2 right-2">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium animate-pulse">
            LIVE
          </div>
        </div>
      )}
    </div>
  );
}