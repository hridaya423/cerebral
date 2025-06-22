'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import LiveRecorder from './LiveRecorder';
import FileUploader from './FileUploader';
import YouTubeProcessor from './YouTubeProcessor';
import { AudioSource, YouTubeVideoInfo } from '../../types';
import { generateUniqueId } from '../../lib/audio-utils';
import { LocalStorage } from '../../lib/storage';

interface AudioManagerProps {
  onAudioSourceReady: (audioSource: AudioSource) => void;
  disabled?: boolean;
}

export default function AudioManager({ onAudioSourceReady, disabled = false }: AudioManagerProps) {
  const [activeTab, setActiveTab] = useState('record');

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    const audioSource: AudioSource = {
      id: generateUniqueId(),
      type: 'recording',
      title: `Recording ${new Date().toLocaleString()}`,
      duration,
      createdAt: new Date(),
      status: 'ready',
      fileSize: audioBlob.size,
      mimeType: audioBlob.type,
    };

    await LocalStorage.saveAudioBlob(audioSource.id, audioBlob);

    onAudioSourceReady(audioSource);
  };

  const handleFileSelect = async (file: File, duration: number) => {
    const audioSource: AudioSource = {
      id: generateUniqueId(),
      type: 'upload',
      title: file.name,
      fileName: file.name,
      duration,
      createdAt: new Date(),
      status: 'ready',
      fileSize: file.size,
      mimeType: file.type,
    };

    await LocalStorage.saveAudioFile(audioSource.id, file);

    onAudioSourceReady(audioSource);
  };

  const handleVideoSelect = (url: string, videoInfo: YouTubeVideoInfo) => {
    const audioSource: AudioSource = {
      id: generateUniqueId(),
      type: 'youtube',
      title: videoInfo.title,
      url,
      duration: videoInfo.duration,
      createdAt: new Date(),
      status: 'ready',
    };

    onAudioSourceReady(audioSource);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
          <TabsTrigger value="record" disabled={disabled} className="py-3 px-2 sm:px-4">
            <span className="hidden sm:inline">Live Recording</span>
            <span className="sm:hidden">Record</span>
          </TabsTrigger>
          <TabsTrigger value="upload" disabled={disabled} className="py-3 px-2 sm:px-4">
            <span className="hidden sm:inline">Upload File</span>
            <span className="sm:hidden">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="youtube" disabled={disabled} className="py-3 px-2 sm:px-4">
            <span className="hidden sm:inline">YouTube Video</span>
            <span className="sm:hidden">YouTube</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="mt-4 sm:mt-6">
          <LiveRecorder
            onRecordingComplete={handleRecordingComplete}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-4 sm:mt-6">
          <FileUploader
            onFileSelect={handleFileSelect}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="youtube" className="mt-4 sm:mt-6">
          <YouTubeProcessor
            onVideoSelect={handleVideoSelect}
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}