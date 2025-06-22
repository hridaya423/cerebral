import ytdl from '@distube/ytdl-core';
import { BaseExtractor } from './base-extractor';
import { YouTubeVideoInfo } from '../../types';

export class DistubeExtractor extends BaseExtractor {
  constructor() {
    super('DisTube YTDL-Core');
  }

  canHandle(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  isValidUrl(url: string): boolean {
    try {
      return ytdl.validateURL(url);
    } catch (error) {
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
        const videoFormats = ytdl.filterFormats(info.formats, 'audioandvideo');
        if (videoFormats.length === 0) {
          throw new Error('No suitable audio formats available');
        }
        
        const bestVideo = videoFormats.reduce((best, current) => {
          const bestBitrate = best.audioBitrate ? parseInt(best.audioBitrate.toString()) : 0;
          const currentBitrate = current.audioBitrate ? parseInt(current.audioBitrate.toString()) : 0;
          return currentBitrate > bestBitrate ? current : best;
        });
        
        return bestVideo.url;
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
        
        const downloadOptions = [
          {
            quality: 'lowestaudio',
            filter: 'audioonly',
            highWaterMark: 1 << 25,
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            }
          },
          {
            quality: 'lowest',
            filter: 'audioonly',
            highWaterMark: 1 << 24,
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
              }
            }
          },
          {
            quality: 'highestaudio',
            filter: 'audioonly',
            highWaterMark: 1 << 23,
          }
        ];
        
        const tryDownload = (optionIndex: number) => {
          if (optionIndex >= downloadOptions.length) {
            reject(new Error('All download options failed'));
            return;
          }
          
          const options = downloadOptions[optionIndex];
          console.log(`[${this.name}] Trying download option ${optionIndex + 1}/${downloadOptions.length}`);
          
          try {
            const stream = ytdl(url, options);
            let hasData = false;
            
            stream.on('data', (chunk) => {
              hasData = true;
              chunks.push(chunk);
            });
            
            stream.on('end', () => {
              if (hasData) {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
              } else {
                console.warn(`[${this.name}] No data received from option ${optionIndex + 1}`);
                tryDownload(optionIndex + 1);
              }
            });
            
            stream.on('error', (error) => {
              console.warn(`[${this.name}] Stream option ${optionIndex + 1} failed:`, error);
              tryDownload(optionIndex + 1);
            });

            const timeout = setTimeout(() => {
              stream.destroy();
              console.warn(`[${this.name}] Download option ${optionIndex + 1} timed out`);
              tryDownload(optionIndex + 1);
            }, 3 * 60 * 1000);

            stream.on('end', () => clearTimeout(timeout));
            stream.on('error', () => clearTimeout(timeout));
            
          } catch (streamError) {
            console.warn(`[${this.name}] Failed to create stream with option ${optionIndex + 1}:`, streamError);
            tryDownload(optionIndex + 1);
          }
        };
        
        tryDownload(0);
        
      } catch (error) {
        console.error(`[${this.name}] Error in download setup:`, error);
        reject(new Error(`Failed to setup download: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  createAudioStream(url: string, options?: ytdl.downloadOptions) {
    try {
      return ytdl(url, {
        quality: 'lowestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 25,
        ...options,
      });
    } catch (error) {
      console.error(`[${this.name}] Error creating audio stream:`, error);
      throw new Error(`Failed to create audio stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}