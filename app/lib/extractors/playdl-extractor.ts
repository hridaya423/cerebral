/* eslint-disable @typescript-eslint/no-unused-vars */
import { stream, video_basic_info } from 'play-dl';
import { BaseExtractor } from './base-extractor';
import { YouTubeVideoInfo } from '../../types';

interface StreamWithUrl {
  url?: string;
  stream?: NodeJS.ReadableStream;
}

export class PlayDlExtractor extends BaseExtractor {
  constructor() {
    super('Play-DL');
  }

  canHandle(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  isValidUrl(url: string): boolean {
    try {
      const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
      ];
      return patterns.some(pattern => pattern.test(url));
    } catch (error) {
      return false;
    }
  }

  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      const info = await video_basic_info(url);
      
      if (!info || !info.video_details) {
        throw new Error('Failed to get video information');
      }

      const video = info.video_details;
      
      return {
        title: video.title || 'Unknown Title',
        duration: video.durationInSec || 0,
        thumbnailUrl: video.thumbnails?.[0]?.url || '',
        description: video.description || '',
        author: video.channel?.name || 'Unknown Author',
      };
    } catch (error) {
      console.error(`[${this.name}] Error getting video info:`, error);
      throw new Error(`Failed to get video information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAudioUrl(url: string): Promise<string> {
    try {
      const qualityOptions = [2, 1, 0];
      
      for (const quality of qualityOptions) {
        try {
          const streamInfo = await stream(url, { 
            quality: quality,
            htmldata: false,
            precache: 0
          }) as StreamWithUrl;
          
          if (streamInfo && streamInfo.url) {
            console.log(`[${this.name}] Success with quality ${quality}`);
            return streamInfo.url;
          }
        } catch (qualityError) {
          console.warn(`[${this.name}] Quality ${quality} failed:`, qualityError);
          continue;
        }
      }
      
      throw new Error('All quality options failed');
    } catch (error) {
      console.error(`[${this.name}] Error extracting audio URL:`, error);
      throw new Error(`Failed to extract audio URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadAudioBuffer(url: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const qualityOptions = [2, 1, 0];
        let streamInfo: StreamWithUrl | undefined;
        
        for (const quality of qualityOptions) {
          try {
            streamInfo = await stream(url, { 
              quality: quality,
              htmldata: false,
              precache: 0
            }) as StreamWithUrl;
            
            if (streamInfo && streamInfo.stream) {
              console.log(`[${this.name}] Stream success with quality ${quality}`);
              break;
            }
          } catch (qualityError) {
            console.warn(`[${this.name}] Stream quality ${quality} failed:`, qualityError);
            continue;
          }
        }
        
        if (!streamInfo || !streamInfo.stream) {
          throw new Error('Failed to get audio stream with any quality');
        }

        const chunks: Buffer[] = [];
        const audioStream = streamInfo.stream;
        
        audioStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        audioStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        audioStream.on('error', (error: Error) => {
          console.error(`[${this.name}] Stream error:`, error);
          reject(new Error(`Failed to download audio: ${error.message}`));
        });

        const timeout = setTimeout(() => {
          if ('destroy' in audioStream && typeof audioStream.destroy === 'function') {
            audioStream.destroy();
          }
          reject(new Error('Download timeout'));
        }, 5 * 60 * 1000);

        audioStream.on('end', () => clearTimeout(timeout));
        audioStream.on('error', () => clearTimeout(timeout));
        
      } catch (error) {
        console.error(`[${this.name}] Error downloading audio:`, error);
        reject(new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  async getStreamInfo(url: string) {
    try {
      return await stream(url, { 
        quality: 2,
        htmldata: false,
        precache: 0
      });
    } catch (error) {
      console.error(`[${this.name}] Error getting stream info:`, error);
      throw new Error(`Failed to get stream info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}