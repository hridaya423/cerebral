'use client';

import { useState } from 'react';
import { Download, FileText, File, Database, FileSpreadsheet, CheckCircle, X, Settings, Clock, AlertCircle } from 'lucide-react';
import { ExportFormat, ExportOptions, Transcription, AudioSource, AnalysisResult } from '../types';
import { useExport } from '../hooks/useExport';

interface ExportManagerProps {
  transcription?: Transcription;
  audioSource?: AudioSource;
  analysis?: AnalysisResult;
  onClose?: () => void;
  className?: string;
}

export default function ExportManager({
  transcription,
  audioSource,
  analysis,
  onClose,
  className = '',
}: ExportManagerProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    includeAnalysis: true,
    includeSegments: true,
    includeTimestamps: true,
    includeConfidence: false,
  });

  const {
    exportSingle,
    exportProgress,
    isExporting,
    getAvailableFormats,
    getFormatInfo,
    getExportStats,
  } = useExport();

  const formats = getAvailableFormats();
  const stats = getExportStats();

  const handleExport = async () => {
    if (!transcription || !audioSource) {
      console.error('Missing required data for export');
      return;
    }

    await exportSingle(selectedFormat, transcription, audioSource, analysis, exportOptions);
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
        return <File className="w-5 h-5 text-blue-500" />;
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'json':
        return <Database className="w-5 h-5 text-green-500" />;
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-orange-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-lg ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Export</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isExporting && (
        <div className="p-4 border-b border-slate-200 bg-blue-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-sm font-medium text-blue-900">
              {exportProgress.message || 'Exporting...'}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress.progress}%` }}
            ></div>
          </div>
        </div>
      )}
    
      {exportProgress.stage === 'completed' && exportProgress.fileName && (
        <div className="p-4 border-b border-slate-200 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Export completed successfully!
              </p>
              <p className="text-xs text-green-700">
                {exportProgress.fileName} ({formatFileSize(exportProgress.fileSize || 0)})
              </p>
            </div>
          </div>
        </div>
      )}
      {exportProgress.stage === 'error' && (
        <div className="p-4 border-b border-slate-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Export failed</p>
              <p className="text-xs text-red-700">{exportProgress.error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {audioSource && (
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-medium text-slate-900 mb-1">{audioSource.title}</h4>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>Type: {audioSource.type}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round(audioSource.duration / 60)}m {Math.round(audioSource.duration % 60)}s
              </span>
              {transcription && (
                <span>
                  {transcription.segments?.length || 0} segments
                </span>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 gap-2">
            {formats.map((format) => {
              const formatInfo = getFormatInfo(format);
              const isSelected = selectedFormat === format;

              return (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getFormatIcon(format)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {formatInfo.name}
                        </span>
                        <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded uppercase">
                          {format}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatInfo.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-900">
              Export Options
            </label>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
            >
              <Settings className="w-4 h-4" />
              {showOptions ? 'Hide' : 'Show'} Options
            </button>
          </div>

          {showOptions && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAnalysis ?? true}
                  onChange={(e) =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeAnalysis: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">Include AI Analysis</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSegments ?? true}
                  onChange={(e) =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeSegments: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">Include Transcript Segments</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTimestamps ?? true}
                  onChange={(e) =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeTimestamps: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">Include Timestamps</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeConfidence ?? false}
                  onChange={(e) =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeConfidence: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">Include Confidence Scores</span>
              </label>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Custom Title (optional)
                </label>
                <input
                  type="text"
                  value={exportOptions.customTitle || ''}
                  onChange={(e) =>
                    setExportOptions(prev => ({
                      ...prev,
                      customTitle: e.target.value || undefined,
                    }))
                  }
                  placeholder={audioSource?.title || 'Default title'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {stats.totalExports > 0 && (
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Recent Exports</h4>
            <div className="space-y-1">
              {stats.recentExports.map((result) => (
                <div key={result.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{result.fileName}</span>
                  <span className="text-slate-500">{formatFileSize(result.fileSize)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
              Total: {stats.totalExports} exports, {formatFileSize(stats.totalSize)}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-500">
          Export will download to your device
        </div>
        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting || !transcription || !audioSource}
            className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : `Export ${selectedFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}