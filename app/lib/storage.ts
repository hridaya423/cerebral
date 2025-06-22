import { AudioSource, Transcription, AnalysisResult, ChatSession, DiagramData } from '../types';

const STORAGE_KEYS = {
  AUDIO_SOURCES: 'cerebral_audio_sources',
  TRANSCRIPTIONS: 'cerebral_transcriptions',
  ANALYSIS_RESULTS: 'cerebral_analysis_results',
  CHAT_SESSIONS: 'cerebral_chat_sessions',
  DIAGRAMS: 'cerebral_diagrams',
  AUDIO_FILES: 'cerebral_audio_files',
  AUDIO_BLOBS: 'cerebral_audio_blobs',
} as const;

export class LocalStorage {
  private static getFromStorage<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return [];
    }
  }
  
  private static saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }
  
  static getAudioSources(): AudioSource[] {
    return this.getFromStorage<AudioSource>(STORAGE_KEYS.AUDIO_SOURCES);
  } 
  
  static saveAudioSource(audioSource: AudioSource): void {
    const sources = this.getAudioSources();
    const existingIndex = sources.findIndex(s => s.id === audioSource.id);
    
    if (existingIndex >= 0) {
      sources[existingIndex] = audioSource;
    } else {
      sources.push(audioSource);
    }
    
    this.saveToStorage(STORAGE_KEYS.AUDIO_SOURCES, sources);
  }
  
  static deleteAudioSource(id: string): void {
    const sources = this.getAudioSources().filter(s => s.id !== id);
    this.saveToStorage(STORAGE_KEYS.AUDIO_SOURCES, sources);
  }
  
  static getTranscriptions(): Transcription[] {
    return this.getFromStorage<Transcription>(STORAGE_KEYS.TRANSCRIPTIONS);
  }
  
  static getTranscriptionByAudioId(audioSourceId: string): Transcription | null {
    const transcriptions = this.getTranscriptions();
    return transcriptions.find(t => t.audioSourceId === audioSourceId) || null;
  }
  
  static saveTranscription(transcription: Transcription): void {
    const transcriptions = this.getTranscriptions();
    const existingIndex = transcriptions.findIndex(t => t.id === transcription.id);
    
    if (existingIndex >= 0) {
      transcriptions[existingIndex] = transcription;
    } else {
      transcriptions.push(transcription);
    }
    
    this.saveToStorage(STORAGE_KEYS.TRANSCRIPTIONS, transcriptions);
  }
  
  static deleteTranscription(id: string): void {
    const transcriptions = this.getTranscriptions().filter(t => t.id !== id);
    this.saveToStorage(STORAGE_KEYS.TRANSCRIPTIONS, transcriptions);
  }
  
  static getAnalysisResults(): AnalysisResult[] {
    return this.getFromStorage<AnalysisResult>(STORAGE_KEYS.ANALYSIS_RESULTS);
  }
  
  static getAnalysisByTranscriptionId(transcriptionId: string): AnalysisResult | null {
    const results = this.getAnalysisResults();
    return results.find(r => r.transcriptionId === transcriptionId) || null;
  }
  
  static saveAnalysisResult(result: AnalysisResult): void {
    const results = this.getAnalysisResults();
    const existingIndex = results.findIndex(r => r.id === result.id);
    
    if (existingIndex >= 0) {
      results[existingIndex] = result;
    } else {
      results.push(result);
    }
    
    this.saveToStorage(STORAGE_KEYS.ANALYSIS_RESULTS, results);
  }
  
  static deleteAnalysisResult(id: string): void {
    const results = this.getAnalysisResults().filter(r => r.id !== id);
    this.saveToStorage(STORAGE_KEYS.ANALYSIS_RESULTS, results);
  }
  
  static getChatSessions(): ChatSession[] {
    return this.getFromStorage<ChatSession>(STORAGE_KEYS.CHAT_SESSIONS);
  }
  
  static getChatSessionByAudioId(audioSourceId: string): ChatSession | null {
    const sessions = this.getChatSessions();
    return sessions.find(s => s.audioSourceId === audioSourceId) || null;
  }
  
  static saveChatSession(session: ChatSession): void {
    const sessions = this.getChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    this.saveToStorage(STORAGE_KEYS.CHAT_SESSIONS, sessions);
  }
  
  static deleteChatSession(id: string): void {
    const sessions = this.getChatSessions().filter(s => s.id !== id);
    this.saveToStorage(STORAGE_KEYS.CHAT_SESSIONS, sessions);
  }
  
  static getDiagrams(): DiagramData[] {
    return this.getFromStorage<DiagramData>(STORAGE_KEYS.DIAGRAMS);
  }
  
  static getDiagramsByTranscriptionId(transcriptionId: string): DiagramData[] {
    const diagrams = this.getDiagrams();
    return diagrams.filter(d => d.transcriptionId === transcriptionId);
  }
  
  static saveDiagram(diagram: DiagramData): void {
    const diagrams = this.getDiagrams();
    const existingIndex = diagrams.findIndex(d => d.id === diagram.id);
    
    if (existingIndex >= 0) {
      diagrams[existingIndex] = diagram;
    } else {
      diagrams.push(diagram);
    }
    
    this.saveToStorage(STORAGE_KEYS.DIAGRAMS, diagrams);
  }
  
  static deleteDiagram(id: string): void {
    const diagrams = this.getDiagrams().filter(d => d.id !== id);
    this.saveToStorage(STORAGE_KEYS.DIAGRAMS, diagrams);
  }
  
  static async saveAudioFile(audioSourceId: string, file: File): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileData = {
        audioSourceId,
        buffer: Array.from(new Uint8Array(arrayBuffer)),
        mimeType: file.type,
        fileName: file.name,
        size: file.size,
      };
      
      localStorage.setItem(`${STORAGE_KEYS.AUDIO_FILES}_${audioSourceId}`, JSON.stringify(fileData));
    } catch (error) {
      console.error('Error saving audio file:', error);
    }
  }
  
  static getAudioFile(audioSourceId: string): { buffer: ArrayBuffer; mimeType: string; fileName: string; size: number } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.AUDIO_FILES}_${audioSourceId}`);
      if (!data) return null;
      
      const fileData = JSON.parse(data);
      return {
        buffer: new Uint8Array(fileData.buffer).buffer,
        mimeType: fileData.mimeType,
        fileName: fileData.fileName,
        size: fileData.size,
      };
    } catch (error) {
      console.error('Error retrieving audio file:', error);
      return null;
    }
  }
  
  static async saveAudioBlob(audioSourceId: string, blob: Blob): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const blobData = {
        audioSourceId,
        buffer: Array.from(new Uint8Array(arrayBuffer)),
        mimeType: blob.type,
        size: blob.size,
      };
      
      localStorage.setItem(`${STORAGE_KEYS.AUDIO_BLOBS}_${audioSourceId}`, JSON.stringify(blobData));
    } catch (error) {
      console.error('Error saving audio blob:', error);
    }
  }
  
  static getAudioBlob(audioSourceId: string): { blob: Blob; mimeType: string; size: number } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.AUDIO_BLOBS}_${audioSourceId}`);
      if (!data) return null;
      
      const blobData = JSON.parse(data);
      const blob = new Blob([new Uint8Array(blobData.buffer)], { type: blobData.mimeType });
      return {
        blob,
        mimeType: blobData.mimeType,
        size: blobData.size,
      };
    } catch (error) {
      console.error('Error retrieving audio blob:', error);
      return null;
    }
  }
  
  static deleteAudioFile(audioSourceId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_KEYS.AUDIO_FILES}_${audioSourceId}`);
  }
  
  static deleteAudioBlob(audioSourceId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_KEYS.AUDIO_BLOBS}_${audioSourceId}`);
  }
    
  static clearAllData(): void {
    if (typeof window === 'undefined') return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
  
  static getStorageSize(): string {
    if (typeof window === 'undefined') return '0 KB';
    
    let totalSize = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    });
    
    return this.formatBytes(totalSize);
  }
  
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 KB';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}