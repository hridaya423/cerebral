import { BaseExtractor, ExtractorHealth } from './base-extractor';
import { DistubeExtractor } from './distube-extractor';
import { PlayDlExtractor } from './playdl-extractor';
import { YtdlExtractor } from './ytdl-extractor';
import { YouTubeVideoInfo } from '../../types';

export class ExtractorManager {
  private extractors: BaseExtractor[];
  private lastHealthCheck: Date | null = null;
  private healthCheckInterval = 5 * 60 * 1000;

  constructor() {
    this.extractors = [
      new DistubeExtractor(),
      new PlayDlExtractor(),
      new YtdlExtractor(),
    ];
  }

  isValidYouTubeUrl(url: string): boolean {
    try {
      return this.extractors.some(extractor => 
        extractor.canHandle(url) && extractor.isValidUrl(url)
      );
    } catch (error) {
      console.error('Error validating YouTube URL:', error);
      return false;
    }
  }

  private getBestExtractor(url: string): BaseExtractor | null {
    const availableExtractors = this.extractors.filter(extractor => 
      extractor.canHandle(url) && extractor.isValidUrl(url)
    );

    if (availableExtractors.length === 0) {
      return null;
    }

    availableExtractors.sort((a, b) => {
      const scoreA = a.getHealth().successRate;
      const scoreB = b.getHealth().successRate;
      return scoreB - scoreA;
    });

    return availableExtractors[0];
  }
  async extractVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    if (!this.isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }

    let lastError: Error | null = null;

    for (const extractor of this.getSortedExtractors(url)) {
      try {
        console.log(`[ExtractorManager] Trying ${extractor.name} for video info`);
        const result = await extractor.extract(url);
        
        if (result.success && result.videoInfo) {
          console.log(`[ExtractorManager] Success with ${extractor.name}`);
          return result.videoInfo;
        } else {
          lastError = new Error(result.error || 'Unknown extraction error');
        }
      } catch (error) {
        console.warn(`[ExtractorManager] ${extractor.name} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue;
      }
    }

    throw lastError || new Error('All extractors failed to get video information');
  }
  async downloadAudioAsBuffer(url: string): Promise<Buffer> {
    if (!this.isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }

    let lastError: Error | null = null;
    const maxRetries = 2;

    for (const extractor of this.getSortedExtractors(url)) {
      for (let retry = 0; retry <= maxRetries; retry++) {
        try {
          const retryText = retry > 0 ? ` (retry ${retry})` : '';
          console.log(`[ExtractorManager] Trying ${extractor.name} for audio download${retryText}`);
          
          const result = await extractor.extractBuffer(url);
          
          if (result.success && result.audioBuffer) {
            console.log(`[ExtractorManager] Success with ${extractor.name}${retryText}`);
            return result.audioBuffer;
          } else {
            lastError = new Error(result.error || 'Unknown extraction error');
            break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`[ExtractorManager] ${extractor.name} failed${retry > 0 ? ` (retry ${retry})` : ''}:`, errorMessage);
          lastError = error instanceof Error ? error : new Error('Unknown error');
          
          if (retry < maxRetries) {
            const delay = Math.pow(2, retry) * 1000;
            console.log(`[ExtractorManager] Retrying ${extractor.name} in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
    throw lastError || new Error('All extractors failed to download audio');
  }

  async getAudioUrl(url: string): Promise<string> {
    if (!this.isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }

    let lastError: Error | null = null;

    for (const extractor of this.getSortedExtractors(url)) {
      try {
        console.log(`[ExtractorManager] Trying ${extractor.name} for audio URL`);
        const audioUrl = await extractor.getAudioUrl(url);
        
        if (audioUrl) {
          console.log(`[ExtractorManager] Success with ${extractor.name}`);
          extractor.recordSuccess();
          return audioUrl;
        }
      } catch (error) {
        console.warn(`[ExtractorManager] ${extractor.name} failed:`, error);
        extractor.recordFailure();
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue;
      }
    }

    throw lastError || new Error('All extractors failed to get audio URL');
  }

  private getSortedExtractors(url: string): BaseExtractor[] {
    return this.extractors
      .filter(extractor => extractor.canHandle(url) && extractor.isValidUrl(url))
      .sort((a, b) => b.getHealth().successRate - a.getHealth().successRate);
  }

  getExtractorHealth(): ExtractorHealth[] {
    return this.extractors.map(extractor => extractor.getHealth());
  }

  getHealthSummary() {
    const healths = this.getExtractorHealth();
    
    return {
      extractors: healths,
      bestExtractor: healths.reduce((best, current) => 
        current.successRate > best.successRate ? current : best
      ),
      overallSuccessRate: healths.reduce((sum, health) => 
        sum + health.successRate, 0) / healths.length,
      lastHealthCheck: this.lastHealthCheck,
      totalExtractors: this.extractors.length
    };
  }

  async performHealthCheck(testUrl?: string): Promise<void> {
    const defaultTestUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const url = testUrl || defaultTestUrl;

    console.log('[ExtractorManager] Performing health check...');

    for (const extractor of this.extractors) {
      try {
        if (extractor.canHandle(url) && extractor.isValidUrl(url)) {
          await extractor.getVideoInfo(url);
          console.log(`[ExtractorManager] Health check passed for ${extractor.name}`);
        }
      } catch (error) {
        console.warn(`[ExtractorManager] Health check failed for ${extractor.name}:`, error);
      }
    }

    this.lastHealthCheck = new Date();
  }

  private async autoHealthCheck(): Promise<void> {
    if (!this.lastHealthCheck || 
        Date.now() - this.lastHealthCheck.getTime() > this.healthCheckInterval) {
      await this.performHealthCheck();
    }
  }
}

export const extractorManager = new ExtractorManager();