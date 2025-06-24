import { useState, useCallback } from 'react';
import { 
  ExportOptions, 
  ExportFormat, 
  ExportProgress, 
  ExportResult, 
  Transcription, 
  AudioSource, 
  AnalysisResult 
} from '../types';
import { ExportUtils } from '../lib/search-export-utils';
import { SessionStorage } from '../lib/storage';

export function useExport() {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    stage: 'completed',
    progress: 100,
  });
  
  const [exportHistory, setExportHistory] = useState<ExportResult[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const exportSingle = useCallback(
    async (
      format: ExportFormat,
      transcription: Transcription,
      audioSource: AudioSource,
      analysis?: AnalysisResult,
      options?: Partial<ExportOptions>
    ): Promise<ExportResult | null> => {
      setIsExporting(true);
      setExportProgress({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing export...',
      });

      try {
        if (!transcription || !audioSource) {
          throw new Error('Missing required data for export');
        }

        setExportProgress({
          stage: 'processing',
          progress: 25,
          message: 'Processing data...',
        });

        const exportOptions: ExportOptions = {
          format,
          includeAnalysis: analysis ? true : false,
          includeSegments: true,
          includeTimestamps: true,
          includeConfidence: false,
          ...options,
        };

        setExportProgress({
          stage: 'generating',
          progress: 50,
          message: `Generating ${format.toUpperCase()} file...`,
        });

        const result = await ExportUtils.exportByFormat(
          format,
          transcription,
          audioSource,
          analysis,
          exportOptions
        );

        setExportProgress({
          stage: 'completed',
          progress: 100,
          message: 'Export completed successfully!',
          fileName: result.fileName,
          fileSize: result.fileSize,
        });

        setExportHistory(prev => [result, ...prev]);

        return result;
      } catch (error) {
        console.error('Export error:', error);
        setExportProgress({
          stage: 'error',
          progress: 0,
          message: 'Export failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportBatch = useCallback(
    async (
      format: ExportFormat,
      audioSourceIds: string[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult[]> => {
      setIsExporting(true);
      const results: ExportResult[] = [];
      const total = audioSourceIds.length;

      setExportProgress({
        stage: 'preparing',
        progress: 0,
        message: `Preparing to export ${total} items...`,
      });

      try {
        for (let i = 0; i < audioSourceIds.length; i++) {
          const audioSourceId = audioSourceIds[i];
          
          setExportProgress({
            stage: 'processing',
            progress: (i / total) * 100,
            message: `Processing ${i + 1} of ${total}...`,
          });

          const audioSource = SessionStorage.getCurrentAudioSource();
          const transcription = SessionStorage.getCurrentTranscription();
          const analysis = SessionStorage.getCurrentAnalysis();

          if (!audioSource || !transcription) {
            console.warn(`Skipping ${audioSourceId} - missing data`);
            continue;
          }

          try {
            const result = await ExportUtils.exportByFormat(
              format,
              transcription,
              audioSource,
              analysis || undefined,
              { format, ...options } as ExportOptions
            );
            
            results.push(result);
          } catch (error) {
            console.error(`Failed to export ${audioSourceId}:`, error);
          }
        }

        setExportProgress({
          stage: 'completed',
          progress: 100,
          message: `Batch export completed! ${results.length} of ${total} files exported.`,
        });

        setExportHistory(prev => [...results, ...prev]);

        return results;
      } catch (error) {
        console.error('Batch export error:', error);
        setExportProgress({
          stage: 'error',
          progress: 0,
          message: 'Batch export failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return [];
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportAll = useCallback(
    async (format: ExportFormat, options?: Partial<ExportOptions>) => {
      const audioSource = SessionStorage.getCurrentAudioSource();
      const audioSourceIds = audioSource ? [audioSource.id] : [];
      
      return exportBatch(format, audioSourceIds, options);
    },
    [exportBatch]
  );

  const exportFiltered = useCallback(
    async (
      format: ExportFormat,
      filter: {
        dateRange?: { start: Date; end: Date };
        audioSourceType?: 'recording' | 'upload' | 'youtube';
        minConfidence?: number;
      },
      options?: Partial<ExportOptions>
    ) => {
      const audioSource = SessionStorage.getCurrentAudioSource();
      const transcription = SessionStorage.getCurrentTranscription();

      if (!audioSource || !transcription) {
        return [];
      }

      let shouldExport = true;

      if (filter.dateRange) {
        shouldExport = shouldExport && 
          audioSource.createdAt >= filter.dateRange.start &&
          audioSource.createdAt <= filter.dateRange.end;
      }

      if (filter.audioSourceType) {
        shouldExport = shouldExport && audioSource.type === filter.audioSourceType;
      }

      if (filter.minConfidence) {
        shouldExport = shouldExport && transcription.confidence >= filter.minConfidence;
      }

      const audioSourceIds = shouldExport ? [audioSource.id] : [];
      return exportBatch(format, audioSourceIds, options);
    },
    [exportBatch]
  );

  const quickExport = useCallback(
    async (
      format: ExportFormat,
      transcriptionId: string
    ): Promise<ExportResult | null> => {
      const transcription = SessionStorage.getCurrentTranscription();
      const audioSource = SessionStorage.getCurrentAudioSource();
      const analysis = SessionStorage.getCurrentAnalysis();

      if (!transcription || transcription.id !== transcriptionId) {
        console.error('Transcription not found or not current session');
        return null;
      }

      if (!audioSource) {
        console.error('Audio source not found');
        return null;
      }

      return exportSingle(format, transcription, audioSource, analysis || undefined);
    },
    [exportSingle]
  );

  const resetProgress = useCallback(() => {
    setExportProgress({
      stage: 'completed',
      progress: 100,
    });
  }, []);

  const clearHistory = useCallback(() => {
    setExportHistory([]);
  }, []);

  const getAvailableFormats = useCallback((): ExportFormat[] => {
    return ['pdf', 'docx', 'txt', 'json', 'csv'];
  }, []);

  const getFormatInfo = useCallback((format: ExportFormat) => {
    const formatInfo = {
      pdf: {
        name: 'PDF Document',
        description: 'Professional formatted document with analysis and transcription',
        icon: '📄',
        supports: ['analysis', 'segments', 'timestamps', 'formatting'],
      },
      docx: {
        name: 'Word Document',
        description: 'Microsoft Word compatible document with full formatting',
        icon: '📝',
        supports: ['analysis', 'segments', 'timestamps', 'formatting'],
      },
      txt: {
        name: 'Plain Text',
        description: 'Simple text file with transcription and analysis',
        icon: '📋',
        supports: ['analysis', 'segments', 'timestamps'],
      },
      json: {
        name: 'JSON Data',
        description: 'Structured data format for developers and integrations',
        icon: '⚙️',
        supports: ['analysis', 'segments', 'timestamps', 'metadata'],
      },
      csv: {
        name: 'CSV Spreadsheet',
        description: 'Comma-separated values for spreadsheet applications',
        icon: '📊',
        supports: ['segments', 'timestamps', 'confidence'],
      },
    };

    return formatInfo[format];
  }, []);

  const getExportStats = useCallback(() => {
    const totalExports = exportHistory.length;
    const totalSize = exportHistory.reduce((sum, result) => sum + result.fileSize, 0);
    const formatBreakdown = exportHistory.reduce((acc, result) => {
      acc[result.format] = (acc[result.format] || 0) + 1;
      return acc;
    }, {} as Record<ExportFormat, number>);

    return {
      totalExports,
      totalSize,
      formatBreakdown,
      recentExports: exportHistory.slice(0, 5),
    };
  }, [exportHistory]);

  return {
    exportProgress,
    exportHistory,
    isExporting,

    exportSingle,
    exportBatch,
    exportAll,
    exportFiltered,
    quickExport,
    resetProgress,
    clearHistory,

    getAvailableFormats,
    getFormatInfo,
    getExportStats,
  };
}