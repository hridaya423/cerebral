/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractorManager } from './extractors/extractor-manager';
import { healthMonitor } from './extractors/health-monitor';
import { DistubeExtractor } from './extractors/distube-extractor';
import { YouTubeVideoInfo } from '../types';

export function isValidYouTubeUrl(url: string): boolean {
  return extractorManager.isValidYouTubeUrl(url);
}

export async function getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
  try {
    console.log('[YouTubeExtractor] Getting video info with fallback system');
    const videoInfo = await extractorManager.extractVideoInfo(url);
    
    healthMonitor.recordMetrics();
    
    return videoInfo;
  } catch (error) {
    console.error('[YouTubeExtractor] Error getting video info:', error);
    
    healthMonitor.recordMetrics();
    
    throw new Error(`Failed to get video information: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractAudioUrl(url: string): Promise<string> {
  try {
    console.log('[YouTubeExtractor] Extracting audio URL with fallback system');
    const audioUrl = await extractorManager.getAudioUrl(url);
    
    healthMonitor.recordMetrics();
    
    return audioUrl;
  } catch (error) {
    console.error('[YouTubeExtractor] Error extracting audio URL:', error);
    
    healthMonitor.recordMetrics();
    
    throw new Error(`Failed to extract audio URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export async function downloadAudioAsBuffer(url: string): Promise<Buffer> {
  try {
    console.log('[YouTubeExtractor] Downloading audio buffer with fallback system');
    const audioBuffer = await extractorManager.downloadAudioAsBuffer(url);
    
    healthMonitor.recordMetrics();
    
    return audioBuffer;
  } catch (error) {
    console.error('[YouTubeExtractor] Error downloading audio buffer:', error);
    
    healthMonitor.recordMetrics();
    
    throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function createAudioStream(url: string, options?: any) {
  try {
    const extractor = new DistubeExtractor();
    
    if (!extractor.canHandle(url) || !extractor.isValidUrl(url)) {
      throw new Error('Invalid YouTube URL for stream creation');
    }
    
    return extractor.createAudioStream(url, options);
  } catch (error) {
    console.error('[YouTubeExtractor] Error creating audio stream:', error);
    throw new Error(`Failed to create audio stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getExtractorHealth() {
  return extractorManager.getHealthSummary();
}

export function getDetailedHealth() {
  return healthMonitor.getHealthSummary();
}

export async function performHealthCheck(testUrl?: string): Promise<void> {
  return await healthMonitor.performHealthCheck(testUrl);
}

export function startHealthMonitoring(intervalMinutes: number = 5): void {
  healthMonitor.startMonitoring(intervalMinutes);
}