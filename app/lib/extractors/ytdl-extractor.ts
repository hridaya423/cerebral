import ytdl from 'ytdl-core';
import { BaseExtractor } from './base-extractor';
import { YouTubeVideoInfo } from '../../types';

export class YtdlExtractor extends BaseExtractor {
  constructor() {
    super('Original YTDL-Core');
  }

  canHandle(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  isValidUrl(url: string): boolean {
    try {
      return ytdl.validateURL(url);
    } catch {
      return false;
    }
  }

  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      return {
        title: videoDetails.title,
        duration: parseInt(videoDetails.lengthSeconds),
        thumbnailUrl: videoDetails.thumbnails[0]?.url || '',
        description: videoDetails.description || '',
        author: videoDetails.author.name,
      };
    } catch (error) {
      console.error(`[${this.name}] Error getting video info:`, error);
      throw new Error(`Failed to get video information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAudioUrl(url: string): Promise<string> {
    try {
      const info = await ytdl.getInfo(url);
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
      
      if (audioFormats.length === 0) {
        throw new Error('No audio formats available');
      }

      const bestAudio = audioFormats.reduce((best, current) => {
        const bestBitrate = best.audioBitrate ? parseInt(best.audioBitrate.toString()) : 0;
        const currentBitrate = current.audioBitrate ? parseInt(current.audioBitrate.toString()) : 0;
        return currentBitrate > bestBitrate ? current : best; 
      });
      
      return bestAudio.url;
    } catch (error) {
      console.error(`[${this.name}] Error extracting audio URL:`, error);
      throw new Error(`Failed to extract audio URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadAudioBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        
        const stream = ytdl(url, {
          quality: 'lowestaudio',
          filter: 'audioonly',
        });
        
        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        stream.on('error', (error) => {
          console.error(`[${this.name}] Stream error:`, error);
          reject(new Error(`Failed to download audio: ${error.message}`));
        });

        const timeout = setTimeout(() => {
          stream.destroy();
          reject(new Error('Download timeout'));
        }, 5 * 60 * 1000);

        stream.on('end', () => clearTimeout(timeout));
        stream.on('error', () => clearTimeout(timeout));
        
      } catch (error) {
        console.error(`[${this.name}] Error creating download stream:`, error);
        reject(new Error(`Failed to create download stream: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  createAudioStream(url: string, options?: ytdl.downloadOptions) {
    try {
      return ytdl(url, {
        quality: 'lowestaudio',
        filter: 'audioonly',
        ...options,
      });
    } catch (error) {
      console.error(`[${this.name}] Error creating audio stream:`, error);
      throw new Error(`Failed to create audio stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}