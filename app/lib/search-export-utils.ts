import Fuse, { IFuseOptions } from 'fuse.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

import { 
  Transcription, 
  TranscriptionSegment, 
  AnalysisResult, 
  AudioSource,
  SearchResult, 
  SearchQuery, 
  SearchFilters,
  ExportOptions,
  ExportFormat,
  ExportResult
} from '../types';
import { generateUniqueId } from './audio-utils';

export class SearchUtils {
  private static fuseOptions: IFuseOptions<TranscriptionSegment> = {
    keys: ['text'],
    threshold: 0.4, 
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  };

  static searchInTranscription(
    transcription: Transcription,
    query: string,
    filters: SearchFilters = {}
  ): SearchResult[] {
    if (!query.trim()) return [];

    if (filters.minConfidence && transcription.confidence < filters.minConfidence) {
      return [];
    }

    if (filters.language && transcription.language !== filters.language) {
      return [];
    }

    const fuse = new Fuse(transcription.segments, this.fuseOptions);
    const fuseResults = fuse.search(query);

    return fuseResults.map((fuseResult) => {
      const segment = fuseResult.item;
      const match = fuseResult.matches?.[0];
      
      return {
        id: generateUniqueId(),
        transcriptionId: transcription.id,
        segmentIndex: transcription.segments.indexOf(segment),
        matchedText: match?.value || segment.text,
        contextText: this.getContextText(transcription.segments, transcription.segments.indexOf(segment)),
        startTime: segment.start,
        endTime: segment.end,
        confidence: segment.confidence,
        score: 1 - (fuseResult.score || 0), 
      };
    });
  }

  static searchByTimeRange(
    transcription: Transcription,
    startTime: number,
    endTime: number
  ): SearchResult[] {
    return transcription.segments
      .filter(segment => segment.start >= startTime && segment.end <= endTime)
      .map((segment, index) => ({
        id: generateUniqueId(),
        transcriptionId: transcription.id,
        segmentIndex: index,
        matchedText: segment.text,
        contextText: this.getContextText(transcription.segments, index),
        startTime: segment.start,
        endTime: segment.end,
        confidence: segment.confidence,
        score: 1.0, 
      }));
  }

  static searchMultipleTranscriptions(
    transcriptions: Transcription[],
    query: SearchQuery
  ): SearchResult[] {
    let allResults: SearchResult[] = [];

    transcriptions.forEach(transcription => {
      let results: SearchResult[] = [];

      if (query.type === 'text' || query.type === 'combined') {
        results = this.searchInTranscription(transcription, query.query, query.filters);
      }

      if (query.type === 'time' || query.type === 'combined') {
        if (query.timeRange) {
          const timeResults = this.searchByTimeRange(
            transcription,
            query.timeRange.start,
            query.timeRange.end
          );
          results = query.type === 'combined' ? [...results, ...timeResults] : timeResults;
        }
      }

      allResults = [...allResults, ...results];
    });

    return allResults.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return (a.startTime || 0) - (b.startTime || 0);
    });
  }

  private static getContextText(segments: TranscriptionSegment[], currentIndex: number): string {
    const contextRange = 1; 
    const start = Math.max(0, currentIndex - contextRange);
    const end = Math.min(segments.length, currentIndex + contextRange + 1);
    
    return segments
      .slice(start, end)
      .map(segment => segment.text)
      .join(' ');
  }

  static highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

export class ExportUtils {
  static async exportToPDF(
    transcription: Transcription,
    audioSource: AudioSource,
    analysis?: AnalysisResult,
    options: ExportOptions = { format: 'pdf', includeAnalysis: true, includeSegments: true, includeTimestamps: true, includeConfidence: false }
  ): Promise<ExportResult> {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');

      const lines = doc.splitTextToSize(text, doc.internal.pageSize.width - 2 * margin);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 5; 
    };

    addText(options.customTitle || audioSource.title, 16, true);
    addText(`Created: ${new Date().toLocaleDateString()}`, 10);
    addText(`Duration: ${this.formatDuration(audioSource.duration)}`, 10);
    yPosition += 10;

    if (options.includeAnalysis && analysis) {
      addText('ANALYSIS', 14, true);
      addText(`Summary: ${analysis.summary.brief}`, 11);
      
      if (analysis.keyNotes.length > 0) {
        addText('Key Notes:', 12, true);
        analysis.keyNotes.forEach((note, index) => {
          addText(`${index + 1}. ${note}`, 10);
        });
      }
      
      if (analysis.actionItems && analysis.actionItems.length > 0) {
        addText('Action Items:', 12, true);
        analysis.actionItems.forEach((item, index) => {
          addText(`${index + 1}. ${item}`, 10);
        });
      }
      yPosition += 10;
    }

    addText('TRANSCRIPTION', 14, true);
    
    if (options.includeSegments && transcription.segments.length > 0) {
      transcription.segments.forEach(segment => {
        let segmentText = '';
        if (options.includeTimestamps) {
          segmentText += `[${this.formatTime(segment.start)}] `;
        }
        segmentText += segment.text;
        if (options.includeConfidence) {
          segmentText += ` (${Math.round(segment.confidence * 100)}%)`;
        }
        addText(segmentText, 10);
      });
    } else {
      addText(transcription.text, 10);
    }

    const pdfBlob = doc.output('blob');
    const fileName = `${audioSource.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    
    saveAs(pdfBlob, fileName);

    return {
      id: generateUniqueId(),
      fileName,
      format: 'pdf',
      fileSize: pdfBlob.size,
      createdAt: new Date(),
      options,
    };
  }

  static async exportToDOCX(
    transcription: Transcription,
    audioSource: AudioSource,
    analysis?: AnalysisResult,
    options: ExportOptions = { format: 'docx', includeAnalysis: true, includeSegments: true, includeTimestamps: true, includeConfidence: false }
  ): Promise<ExportResult> {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        text: options.customTitle || audioSource.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Created: ', bold: true }),
          new TextRun(new Date().toLocaleDateString()),
          new TextRun(' | '),
          new TextRun({ text: 'Duration: ', bold: true }),
          new TextRun(this.formatDuration(audioSource.duration)),
        ],
      })
    );

    paragraphs.push(new Paragraph({ text: '' })); 

    if (options.includeAnalysis && analysis) {
      paragraphs.push(
        new Paragraph({
          text: 'Analysis',
          heading: HeadingLevel.HEADING_1,
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Summary: ', bold: true }),
            new TextRun(analysis.summary.brief),
          ],
        })
      );

      if (analysis.keyNotes.length > 0) {
        paragraphs.push(
          new Paragraph({
            text: 'Key Notes:',
            heading: HeadingLevel.HEADING_2,
          })
        );
        
        analysis.keyNotes.forEach((note, index) => {
          paragraphs.push(
            new Paragraph({
              text: `${index + 1}. ${note}`,
            })
          );
        });
      }

      if (analysis.actionItems && analysis.actionItems.length > 0) {
        paragraphs.push(
          new Paragraph({
            text: 'Action Items:',
            heading: HeadingLevel.HEADING_2,
          })
        );
        
        analysis.actionItems.forEach((item, index) => {
          paragraphs.push(
            new Paragraph({
              text: `${index + 1}. ${item}`,
            })
          );
        });
      }
    }

    paragraphs.push(
      new Paragraph({
        text: 'Transcription',
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (options.includeSegments && transcription.segments.length > 0) {
      transcription.segments.forEach(segment => {
        const textRuns: TextRun[] = [];
        
        if (options.includeTimestamps) {
          textRuns.push(new TextRun({ text: `[${this.formatTime(segment.start)}] `, bold: true }));
        }
        
        textRuns.push(new TextRun(segment.text));
        
        if (options.includeConfidence) {
          textRuns.push(new TextRun({ text: ` (${Math.round(segment.confidence * 100)}%)`, italics: true }));
        }

        paragraphs.push(new Paragraph({ children: textRuns }));
      });
    } else {
      paragraphs.push(new Paragraph({ text: transcription.text }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const fileName = `${audioSource.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`;
    
    saveAs(blob, fileName);

    return {
      id: generateUniqueId(),
      fileName,
      format: 'docx',
      fileSize: blob.size,
      createdAt: new Date(),
      options,
    };
  }

  static async exportToTXT(
    transcription: Transcription,
    audioSource: AudioSource,
    analysis?: AnalysisResult,
    options: ExportOptions = { format: 'txt', includeAnalysis: true, includeSegments: true, includeTimestamps: true, includeConfidence: false }
  ): Promise<ExportResult> {
    let content = '';

    content += `${options.customTitle || audioSource.title}\n`;
    content += `Created: ${new Date().toLocaleDateString()}\n`;
    content += `Duration: ${this.formatDuration(audioSource.duration)}\n\n`;

    if (options.includeAnalysis && analysis) {
      content += '--- ANALYSIS ---\n\n';
      content += `Summary: ${analysis.summary.brief}\n\n`;

      if (analysis.keyNotes.length > 0) {
        content += 'Key Notes:\n';
        analysis.keyNotes.forEach((note, index) => {
          content += `${index + 1}. ${note}\n`;
        });
        content += '\n';
      }

      if (analysis.actionItems && analysis.actionItems.length > 0) {
        content += 'Action Items:\n';
        analysis.actionItems.forEach((item, index) => {
          content += `${index + 1}. ${item}\n`;
        });
        content += '\n';
      }
    }

    content += '--- TRANSCRIPTION ---\n\n';

    if (options.includeSegments && transcription.segments.length > 0) {
      transcription.segments.forEach(segment => {
        let line = '';
        if (options.includeTimestamps) {
          line += `[${this.formatTime(segment.start)}] `;
        }
        line += segment.text;
        if (options.includeConfidence) {
          line += ` (${Math.round(segment.confidence * 100)}%)`;
        }
        content += line + '\n';
      });
    } else {
      content += transcription.text;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const fileName = `${audioSource.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
    
    saveAs(blob, fileName);

    return {
      id: generateUniqueId(),
      fileName,
      format: 'txt',
      fileSize: blob.size,
      createdAt: new Date(),
      options,
    };
  }

  static async exportToJSON(
    transcription: Transcription,
    audioSource: AudioSource,
    analysis?: AnalysisResult,
    options: ExportOptions = { format: 'json', includeAnalysis: true, includeSegments: true, includeTimestamps: true, includeConfidence: true }
  ): Promise<ExportResult> {
    const data = {
      metadata: {
        title: options.customTitle || audioSource.title,
        exportedAt: new Date().toISOString(),
        audioSource: {
          id: audioSource.id,
          type: audioSource.type,
          duration: audioSource.duration,
          createdAt: audioSource.createdAt,
        },
        transcription: {
          id: transcription.id,
          language: transcription.language,
          confidence: transcription.confidence,
          createdAt: transcription.createdAt,
        },
      },
      analysis: options.includeAnalysis ? analysis : undefined,
      transcription: {
        text: transcription.text,
        segments: options.includeSegments ? transcription.segments : undefined,
      },
    };

    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const fileName = `${audioSource.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    
    saveAs(blob, fileName);

    return {
      id: generateUniqueId(),
      fileName,
      format: 'json',
      fileSize: blob.size,
      createdAt: new Date(),
      options,
    };
  }

  static async exportToCSV(
    transcription: Transcription,
    audioSource: AudioSource,
    options: ExportOptions = { format: 'csv', includeAnalysis: false, includeSegments: true, includeTimestamps: true, includeConfidence: true }
  ): Promise<ExportResult> {
    const headers = ['Segment', 'Start Time', 'End Time', 'Text'];
    if (options.includeConfidence) headers.push('Confidence');

    let content = headers.join(',') + '\n';

    if (options.includeSegments && transcription.segments.length > 0) {
      transcription.segments.forEach((segment, index) => {
        const row = [
          index + 1,
          this.formatTime(segment.start),
          this.formatTime(segment.end),
          `"${segment.text.replace(/"/g, '""')}"`,  
        ];
        
        if (options.includeConfidence) {
          row.push(Math.round(segment.confidence * 100).toString());
        }
        
        content += row.join(',') + '\n';
      });
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const fileName = `${audioSource.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
    
    saveAs(blob, fileName);

    return {
      id: generateUniqueId(),
      fileName,
      format: 'csv',
      fileSize: blob.size,
      createdAt: new Date(),
      options,
    };
  }

  static async exportByFormat(
    format: ExportFormat,
    transcription: Transcription,
    audioSource: AudioSource,
    analysis?: AnalysisResult,
    options?: Partial<ExportOptions>
  ): Promise<ExportResult> {
    const exportOptions: ExportOptions = {
      format,
      includeAnalysis: true,
      includeSegments: true,
      includeTimestamps: true,
      includeConfidence: false,
      ...options,
    };

    switch (format) {
      case 'pdf':
        return this.exportToPDF(transcription, audioSource, analysis, exportOptions);
      case 'docx':
        return this.exportToDOCX(transcription, audioSource, analysis, exportOptions);
      case 'txt':
        return this.exportToTXT(transcription, audioSource, analysis, exportOptions);
      case 'json':
        return this.exportToJSON(transcription, audioSource, analysis, exportOptions);
      case 'csv':
        return this.exportToCSV(transcription, audioSource, exportOptions);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  }
}