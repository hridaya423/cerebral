'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Download, RefreshCw, Eye, Code } from 'lucide-react';
import { useTranscription } from '../hooks/useTranscription';
import { DiagramData } from '../types';
import mermaid from 'mermaid';

interface DiagramViewerProps {
  transcriptionText: string;
  transcriptionId: string;
}

export default function DiagramViewer({ transcriptionText, transcriptionId }: DiagramViewerProps) {
  const [diagrams, setDiagrams] = useState<DiagramData[]>([]);
  const [selectedDiagramType, setSelectedDiagramType] = useState<string>('flowchart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  
  const { generateDiagram } = useTranscription();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      mindmap: {
        useMaxWidth: true,
      },
    });
  }, []);

  const diagramTypes = [
    { id: 'flowchart', name: 'Flowchart', description: 'Process flows and workflows' },
    { id: 'mindmap', name: 'Mind Map', description: 'Topics and relationships' },
    { id: 'concept', name: 'Concept Map', description: 'Concepts and connections' },
    { id: 'timeline', name: 'Timeline', description: 'Chronological events' },
    { id: 'network', name: 'Network', description: 'Relationships and dependencies' },
  ];

  const handleGenerateDiagram = async () => {
    setIsGenerating(true);
    
    try {
      const diagramResult = await generateDiagram(transcriptionText, selectedDiagramType);
      
      const newDiagram: DiagramData = {
        id: Date.now().toString(),
        transcriptionId,
        type: selectedDiagramType as DiagramData['type'],
        title: diagramResult.title,
        mermaidCode: diagramResult.mermaidCode,
        description: diagramResult.description,
        createdAt: new Date(),
      };
      
      setDiagrams(prev => {
        const updated = [newDiagram, ...prev]
        setTimeout(() => {
          renderMermaidDiagram(newDiagram.mermaidCode, `mermaid-0`);
        }, 100);
        return updated;
      });
    } catch (error) {
      console.error('Error generating diagram:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMermaidDiagram = useCallback(async (mermaidCode: string, containerId: string) => {
    if (typeof window !== 'undefined' && viewMode === 'visual') {
      try {
        const element = document.getElementById(containerId);
        if (element) {
          element.innerHTML = '';
          const { svg } = await mermaid.render(`diagram-${containerId}`, mermaidCode);
          element.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        const element = document.getElementById(containerId);
        if (element) {
          element.innerHTML = `
            <div class="bg-red-50 p-4 rounded-md border border-red-200">
              <p class="text-red-700 text-sm mb-2">Failed to render diagram visually</p>
              <pre class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">${mermaidCode}</pre>
            </div>
          `;
        }
      }
    } else {
      const element = document.getElementById(containerId);
      if (element) {
        element.innerHTML = `
          <div class="bg-gray-50 p-4 rounded-md border">
            <pre class="text-sm text-gray-700 whitespace-pre-wrap">${mermaidCode}</pre>
          </div>
        `;
      }
    }
  }, [viewMode]);

  useEffect(() => {
    const renderDiagrams = () => {
      diagrams.forEach((diagram, index) => {
        renderMermaidDiagram(diagram.mermaidCode, `mermaid-${index}`);
      });
    };

    renderDiagrams();
  }, [viewMode, diagrams, renderMermaidDiagram]);

  const downloadDiagram = (diagram: DiagramData) => {
    const dataStr = `data:text/plain;charset=utf-8,${encodeURIComponent(diagram.mermaidCode)}`;
    const downloadElement = document.createElement('a');
    downloadElement.setAttribute('href', dataStr);
    downloadElement.setAttribute('download', `${diagram.title.replace(/\s+/g, '_')}.mmd`);
    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Generate Diagrams</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagram Type
            </label>
            <select
              value={selectedDiagramType}
              onChange={(e) => setSelectedDiagramType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isGenerating}
            >
              {diagramTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateDiagram}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <GitBranch className="w-4 h-4" />
                Generate {diagramTypes.find(t => t.id === selectedDiagramType)?.name}
              </>
            )}
          </button>
        </div>
      </div>

      {diagrams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Generated Diagrams</h3>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'visual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-3 h-3" />
                Visual
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'code'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-3 h-3" />
                Code
              </button>
            </div>
          </div>
          
          {diagrams.map((diagram, index) => (
            <div key={diagram.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-1">
                    {diagram.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {diagram.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{diagram.type}</span>
                    <span>•</span>
                    <span>{diagram.createdAt.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => downloadDiagram(diagram)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>

              <div 
                id={`mermaid-${index}`}
                className="border rounded-lg p-4 bg-white overflow-auto"
                style={{ minHeight: '200px' }}
              >
              </div>
            </div>
          ))}
        </div>
      )}

      {diagrams.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border">
          <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Diagrams Yet</h3>
          <p className="text-gray-600 mb-4">
            Generate visual diagrams from your transcribed content to better understand relationships and flows.
          </p>
        </div>
      )}
    </div>
  );
}