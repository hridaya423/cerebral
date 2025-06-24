import { AudioSource, Transcription, AnalysisResult, ChatSession, DiagramData } from '../types';

const SESSION_KEYS = {
  CURRENT_AUDIO_SOURCE: 'current_audio_source',
  CURRENT_TRANSCRIPTION: 'current_transcription', 
  CURRENT_ANALYSIS: 'current_analysis',
  CURRENT_CHAT_SESSION: 'current_chat_session',
  CURRENT_DIAGRAMS: 'current_diagrams',
  CURRENT_AUDIO_FILE: 'current_audio_file',
  CURRENT_AUDIO_BLOB: 'current_audio_blob',
} as const;

export class SessionStorage {
  private static initialized = false;

  static initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;
    
    this.clearAllData();
    
    window.addEventListener('beforeunload', () => {
      this.clearAllData();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.clearAllData();
      }
    });

    this.initialized = true;
  }

  private static setSessionData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to sessionStorage (${key}):`, error);
    }
  }

  private static getSessionData<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from sessionStorage (${key}):`, error);
      return null;
    }
  }

  private static removeSessionData(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  }

  static getCurrentAudioSource(): AudioSource | null {
    return this.getSessionData<AudioSource>(SESSION_KEYS.CURRENT_AUDIO_SOURCE);
  }

  static saveCurrentAudioSource(audioSource: AudioSource): void {
    this.setSessionData(SESSION_KEYS.CURRENT_AUDIO_SOURCE, audioSource);
  }

  static clearCurrentAudioSource(): void {
    this.removeSessionData(SESSION_KEYS.CURRENT_AUDIO_SOURCE);
  }

  static getCurrentTranscription(): Transcription | null {
    return this.getSessionData<Transcription>(SESSION_KEYS.CURRENT_TRANSCRIPTION);
  }

  static saveCurrentTranscription(transcription: Transcription): void {
    this.setSessionData(SESSION_KEYS.CURRENT_TRANSCRIPTION, transcription);
  }

  static clearCurrentTranscription(): void {
    this.removeSessionData(SESSION_KEYS.CURRENT_TRANSCRIPTION);
  }

  static getCurrentAnalysis(): AnalysisResult | null {
    return this.getSessionData<AnalysisResult>(SESSION_KEYS.CURRENT_ANALYSIS);
  }

  static saveCurrentAnalysis(analysis: AnalysisResult): void {
    this.setSessionData(SESSION_KEYS.CURRENT_ANALYSIS, analysis);
  }

  static clearCurrentAnalysis(): void {
    this.removeSessionData(SESSION_KEYS.CURRENT_ANALYSIS);
  }

  static getCurrentChatSession(): ChatSession | null {
    return this.getSessionData<ChatSession>(SESSION_KEYS.CURRENT_CHAT_SESSION);
  }

  static saveCurrentChatSession(session: ChatSession): void {
    this.setSessionData(SESSION_KEYS.CURRENT_CHAT_SESSION, session);
  }

  static clearCurrentChatSession(): void {
    this.removeSessionData(SESSION_KEYS.CURRENT_CHAT_SESSION);
  }

  static getCurrentDiagrams(): DiagramData[] {
    return this.getSessionData<DiagramData[]>(SESSION_KEYS.CURRENT_DIAGRAMS) || [];
  }

  static saveCurrentDiagrams(diagrams: DiagramData[]): void {
    this.setSessionData(SESSION_KEYS.CURRENT_DIAGRAMS, diagrams);
  }

  static addCurrentDiagram(diagram: DiagramData): void {
    const diagrams = this.getCurrentDiagrams();
    const existingIndex = diagrams.findIndex(d => d.id === diagram.id);
    
    if (existingIndex >= 0) {
      diagrams[existingIndex] = diagram;
    } else {
      diagrams.push(diagram);
    }
    
    this.saveCurrentDiagrams(diagrams);
  }

  static clearCurrentDiagrams(): void {
    this.removeSessionData(SESSION_KEYS.CURRENT_DIAGRAMS);
  }

  static async saveCurrentAudioFile(file: File): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileData = {
        buffer: Array.from(new Uint8Array(arrayBuffer)),
        mimeType: file.type,
        fileName: file.name,
        size: file.size
      };
      
      this.setSessionData(SESSION_KEYS.CURRENT_AUDIO_FILE, fileData);
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw error;
    }
  }

  static getCurrentAudioFile(): { buffer: ArrayBuffer; mimeType: string; fileName: string; size: number } | null {
    const fileData = this.getSessionData<{
      buffer: number[];
      mimeType: string;
      fileName: string;
      size: number;
    }>(SESSION_KEYS.CURRENT_AUDIO_FILE);
    
    if (fileData && fileData.buffer) {
      try {
        const uint8Array = new Uint8Array(fileData.buffer);
        return {
          buffer: uint8Array.buffer,
          mimeType: fileData.mimeType,
          fileName: fileData.fileName,
          size: fileData.size
        };
      } catch (error) {
        console.error('Error reconstructing audio file:', error);
        return null;
      }
    }
    
    return null;
  }

  static clearCurrentAudioFile(): void {
    this.removeSessionData(SESSION_KEYS.CURRENT_AUDIO_FILE);
  }

  static async saveCurrentAudioBlob(blob: Blob): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const blobData = {
        buffer: Array.from(new Uint8Array(arrayBuffer)),
        mimeType: blob.type,
        size: blob.size
      };
      
      this.setSessionData(SESSION_KEYS.CURRENT_AUDIO_BLOB, blobData);
    } catch (error) {
      console.error('Error saving audio blob:', error);
      throw error;
    }
  }

  static getCurrentAudioBlob(): { blob: Blob; mimeType: string; size: number } | null {
    const blobData = this.getSessionData<{
      buffer: number[];
      mimeType: string;
      size: number;
    }>(SESSION_KEYS.CURRENT_AUDIO_BLOB);
    
    if (blobData && blobData.buffer) {
      try {
        const uint8Array = new Uint8Array(blobData.buffer);
        const blob = new Blob([uint8Array], { type: blobData.mimeType });
        return {
          blob,
          mimeType: blobData.mimeType,
          size: blobData.size
        };
      } catch (error) {
        console.error('Error reconstructing audio blob:', error);
        return null;
      }
    }
    
    return null;
  }

  static clearCurrentAudioBlob(): void {
    this.removeSessionData(SESSION_KEYS.CURRENT_AUDIO_BLOB);
  }

  static clearAllData(): void {
    if (typeof window === 'undefined') return;
    
    Object.values(SESSION_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cerebral_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    console.log('All session data has been cleared');
  }

  static resetCurrentSession(): void {
    this.clearCurrentAudioSource();
    this.clearCurrentTranscription();
    this.clearCurrentAnalysis();
    this.clearCurrentChatSession();
    this.clearCurrentDiagrams();
    this.clearCurrentAudioFile();
    this.clearCurrentAudioBlob();
  }
}

export const LocalStorage = SessionStorage;