import { YouTubeVideoInfo } from '../../types';

export interface ExtractionResult {
  success: boolean;
  videoInfo?: YouTubeVideoInfo;
  audioUrl?: string;
  audioBuffer?: Buffer;
  error?: string;
  extractorUsed?: string;
}

export interface ExtractorHealth {
  name: string;
  successRate: number;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  totalAttempts: number;
  successCount: number;
}

export abstract class BaseExtractor {
  public readonly name: string;
  protected health: ExtractorHealth;

  constructor(name: string) {
    this.name = name;
    this.health = {
      name,
      successRate: 0.5,
      lastSuccess: null,
      lastFailure: null,
      totalAttempts: 0,
      successCount: 0
    };
  }

  abstract canHandle(url: string): boolean;
  abstract isValidUrl(url: string): boolean;
  abstract getVideoInfo(url: string): Promise<YouTubeVideoInfo>;
  abstract getAudioUrl(url: string): Promise<string>;
  abstract downloadAudioBuffer(url: string): Promise<Buffer>;

  recordSuccess(): void {
    this.health.totalAttempts++;
    this.health.successCount++;
    this.health.lastSuccess = new Date();
    this.updateSuccessRate();
  }

  recordFailure(): void {
    this.health.totalAttempts++;
    this.health.lastFailure = new Date();
    this.updateSuccessRate();
  }

  private updateSuccessRate(): void {
    if (this.health.totalAttempts === 0) {
      this.health.successRate = 0.5;
    } else {
      const currentRate = this.health.successCount / this.health.totalAttempts;
      this.health.successRate = this.health.successRate * 0.7 + currentRate * 0.3;
    }
  }

  getHealth(): ExtractorHealth {
    return { ...this.health };
  }

  async extract(url: string): Promise<ExtractionResult> {
    try {
      if (!this.canHandle(url)) {
        throw new Error(`${this.name} cannot handle this URL`);
      }

      if (!this.isValidUrl(url)) {
        throw new Error(`Invalid URL format for ${this.name}`);
      }

      const videoInfo = await this.getVideoInfo(url);
      const audioUrl = await this.getAudioUrl(url);

      this.recordSuccess();
      return {
        success: true,
        videoInfo,
        audioUrl,
        extractorUsed: this.name
      };
    } catch (error) {
      this.recordFailure();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        extractorUsed: this.name
      };
    }
  }

  async extractBuffer(url: string): Promise<ExtractionResult> {
    try {
      if (!this.canHandle(url)) {
        throw new Error(`${this.name} cannot handle this URL`);
      }

      if (!this.isValidUrl(url)) {
        throw new Error(`Invalid URL format for ${this.name}`);
      }

      const videoInfo = await this.getVideoInfo(url);
      const audioBuffer = await this.downloadAudioBuffer(url);

      this.recordSuccess();
      return {
        success: true,
        videoInfo,
        audioBuffer,
        extractorUsed: this.name
      };
    } catch (error) {
      this.recordFailure();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        extractorUsed: this.name
      };
    }
  }
}