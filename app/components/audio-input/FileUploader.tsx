'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { isValidAudioFile, isValidFileSize, formatFileSize, getAudioDuration } from '../../lib/audio-utils';
import Card from '../ui/Card';

interface FileUploaderProps {
  onFileSelect: (file: File, duration: number) => Promise<void>;
  disabled?: boolean;
}

export default function FileUploader({ onFileSelect, disabled = false }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = useCallback(async (file: File) => {
    setFileError(null);
    setIsProcessing(true);

    if (!isValidAudioFile(file)) {
      setFileError('Invalid file format. Please upload MP3, WAV, M4A, OGG, or WEBM files.');
      setIsProcessing(false);
      return;
    }

    if (!isValidFileSize(file)) {
      setFileError('File is too large. Maximum size is 25MB.');
      setIsProcessing(false);
      return;
    }

    try {
      const duration = await getAudioDuration(file);
      setSelectedFile(file);
      await onFileSelect(file, duration);
    } catch {
      setFileError('Failed to process audio file. Please try a different file.');
    } finally {
      setIsProcessing(false);
    }
  }, [onFileSelect]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    validateAndProcessFile(file);
  }, [validateAndProcessFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Card className="p-4 sm:p-8">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg">
          <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Upload Audio File</h3>
      </div>

      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition-all duration-200 min-h-[120px] sm:min-h-[140px] flex items-center justify-center ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : fileError
              ? 'border-red-400 bg-red-50'
              : 'border-slate-300 hover:border-purple-300 hover:bg-purple-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-100" />
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent absolute top-0 left-0" />
              </div>
              <span className="text-slate-700 font-semibold text-lg">Processing file...</span>
            </div>
          ) : selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-green-900 text-lg">{selectedFile.name}</p>
                <p className="text-sm text-green-700 font-semibold">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="group p-2 hover:bg-green-200/50 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-green-600 group-hover:text-green-700" />
              </button>
            </div>
          ) : fileError ? (
            <div className="flex items-center justify-center gap-4">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-red-900 text-lg">Upload Error</p>
                <p className="text-sm text-red-700 font-semibold">{fileError}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="group p-2 hover:bg-red-200/50 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-red-600 group-hover:text-red-700" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 w-full">
              <div className="bg-slate-100 w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto">
                <File className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  Drop your audio file here
                </p>
                <p className="text-sm sm:text-base text-slate-600 font-medium">
                  or tap to browse files
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 mt-3 sm:mt-4 border border-slate-200">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Supports MP3, WAV, M4A, OGG, WEBM (max 25MB)
                </p>
              </div>
            </div>
          )}
        </div>
        {!selectedFile && !fileError && !isProcessing && (
          <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
            <p className="text-slate-700 font-medium text-center text-sm sm:text-base">Upload an audio file to transcribe and analyze with AI intelligence.</p>
            <p className="text-xs sm:text-sm text-slate-600 font-medium text-center mt-1">Supported formats: MP3, WAV, M4A, OGG, WEBM (maximum 25MB)</p>
          </div>
        )}
      </div>
    </Card>
  );
}