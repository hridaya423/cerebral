'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Download, RefreshCw, Eye, Code, ChevronDown, Image, FileText, Code2, Maximize2, ZoomIn, ZoomOut, RotateCcw, Columns, Plus, Minus } from 'lucide-react';
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
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null);
  const [fullscreenDiagram, setFullscreenDiagram] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<Record<string, number>>({});
  const [panPosition, setPanPosition] = useState<Record<string, { x: number; y: number }>>({});
  const [sideByView, setSideByView] = useState<boolean>(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  const handleComparisonSelection = (diagramId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(diagramId)) {
        return prev.filter(id => id !== diagramId);
      } else if (prev.length < 2) {
        return [...prev, diagramId];
      } else {
        return [prev[1], diagramId];
      }
    });
  };


  


  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      mindmap: {
        padding: 20,
        maxNodeWidth: 200,
      },
      fontFamily: 'Kalam, "Comic Sans MS", cursive',
      fontSize: 16,
    });
  }, []);

  const diagramTypes = [
    { id: 'flowchart', name: 'Flowchart', description: 'Process flows and workflows' },
    { id: 'mindmap', name: 'Mind Map', description: 'Topics and relationships' },
    { id: 'concept', name: 'Concept Map', description: 'Concepts and connections' },
    { id: 'timeline', name: 'Timeline', description: 'Chronological events' },
    { id: 'network', name: 'Network', description: 'Relationships and dependencies' },
  ];



  const handleGenerateDiagram = async (regenerationType?: 'detailed' | 'simplified') => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcriptionText,
          diagramType: selectedDiagramType,
          regenerationType
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        const newDiagram: DiagramData = {
          id: Date.now().toString(),
          transcriptionId,
          type: selectedDiagramType as DiagramData['type'],
          title: data.diagram.title,
          mermaidCode: data.diagram.mermaidCode,
          description: data.diagram.description,
          createdAt: new Date(),
        };
        
        setDiagrams(prev => {
          const updated = [newDiagram, ...prev]
          setTimeout(() => {
            renderMermaidDiagram(newDiagram.mermaidCode, `mermaid-0`);
          }, 100);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error generating diagram:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateDiagram = async (diagram: DiagramData, regenerationType: 'detailed' | 'simplified') => {
    setIsRegenerating(diagram.id);
    
    try {
      const response = await fetch('/api/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcriptionText,
          diagramType: diagram.type,
          regenerationType
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        const updatedDiagram: DiagramData = {
          ...diagram,
          title: data.diagram.title,
          mermaidCode: data.diagram.mermaidCode,
          description: data.diagram.description,
          createdAt: new Date(),
        };
        
        setDiagrams(prev => {
          const updated = prev.map(d => d.id === diagram.id ? updatedDiagram : d);
          setTimeout(() => {
            const index = prev.findIndex(d => d.id === diagram.id);
            if (index !== -1) {
              renderMermaidDiagram(updatedDiagram.mermaidCode, `mermaid-${index}`);
            }
          }, 100);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error regenerating diagram:', error);
    } finally {
      setIsRegenerating(null);
    }
  };

  const renderMermaidDiagram = useCallback(async (mermaidCode: string, containerId: string) => {
    if (!mermaidCode || typeof window === 'undefined') return;
    
    if (viewMode === 'visual') {
      try {
        const element = document.getElementById(containerId);
        if (!element) return;
        
        element.innerHTML = '';
        
        if (!mermaidCode.trim() || mermaidCode.trim().length < 10) {
          throw new Error('Invalid or empty diagram code');
        }
        
        const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const diagramWithConfig = `---
config:
  look: handDrawn
  theme: neutral
---
${mermaidCode}`;
        
        const { svg } = await mermaid.render(diagramId, diagramWithConfig);
        
        if (element) {
          element.innerHTML = svg;
          const svgElement = element.querySelector('svg');
          if (svgElement) {
            svgElement.style.filter = 'drop-shadow(2px 4px 8px rgba(0,0,0,0.1))';
          }
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        const element = document.getElementById(containerId);
        if (element) {
          element.innerHTML = `
            <div class="bg-amber-50 p-4 rounded-md border border-amber-200">
              <div class="flex items-start gap-3">
                <div class="text-amber-600 text-lg">⚠️</div>
                <div>
                  <p class="text-amber-800 text-sm font-medium mb-1">Diagram Syntax Error</p>
                  <p class="text-amber-700 text-xs mb-3">The generated diagram contains invalid syntax. Try regenerating this diagram type.</p>
                  <button 
                    onclick="window.location.reload()" 
                    class="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 rounded transition-colors mb-2"
                  >
                    Regenerate Diagram
                  </button>
                  <details class="text-xs">
                    <summary class="text-amber-600 cursor-pointer hover:text-amber-800">View technical details</summary>
                    <pre class="mt-2 text-amber-600 text-xs whitespace-pre-wrap">${error instanceof Error ? error.message : 'Unknown error'}</pre>
                  </details>
                </div>
              </div>
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
      
      if (fullscreenDiagram) {
        const diagram = diagrams.find(d => d.id === fullscreenDiagram);
        if (diagram) {
          renderMermaidDiagram(diagram.mermaidCode, 'mermaid-fullscreen');
        }
      }
      
      if (sideByView && selectedForComparison.length === 2) {
        setTimeout(() => {
          selectedForComparison.forEach((diagramId, index) => {
            const diagram = diagrams.find(d => d.id === diagramId);
            if (diagram) {
              renderMermaidDiagram(diagram.mermaidCode, `mermaid-compare-${index}`);
            }
          });
        }, 100);
      }
    };

    renderDiagrams();
  }, [viewMode, diagrams, renderMermaidDiagram, fullscreenDiagram, sideByView, selectedForComparison]);

  useEffect(() => {
    if (sideByView && selectedForComparison.length === 2) {
      const timer = setTimeout(() => {
        selectedForComparison.forEach((diagramId, index) => {
          const diagram = diagrams.find(d => d.id === diagramId);
          if (diagram) {
            const element = document.getElementById(`mermaid-compare-${index}`);
            if (element) {
              renderMermaidDiagram(diagram.mermaidCode, `mermaid-compare-${index}`);
            }
          }
        });
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [sideByView, selectedForComparison, diagrams, renderMermaidDiagram]);

  const downloadDiagram = async (diagram: DiagramData, format: 'mmd' | 'png' | 'svg' = 'mmd') => {
    const fileName = diagram.title.replace(/\s+/g, '_');
    
    if (format === 'mmd') {
      const dataStr = `data:text/plain;charset=utf-8,${encodeURIComponent(diagram.mermaidCode)}`;
      const downloadElement = document.createElement('a');
      downloadElement.setAttribute('href', dataStr);
      downloadElement.setAttribute('download', `${fileName}.mmd`);
      document.body.appendChild(downloadElement);
      downloadElement.click();
      document.body.removeChild(downloadElement);
      return;
    }
    
    const diagramIndex = diagrams.findIndex(d => d.id === diagram.id);
    const svgElement = document.querySelector(`#mermaid-${diagramIndex} svg`);
    
    if (!svgElement) {
      console.error('SVG element not found');
      return;
    }
    
    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const dataStr = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
      const downloadElement = document.createElement('a');
      downloadElement.setAttribute('href', dataStr);
      downloadElement.setAttribute('download', `${fileName}.svg`);
      document.body.appendChild(downloadElement);
      downloadElement.click();
      document.body.removeChild(downloadElement);
    } else if (format === 'png') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Canvas context not available');
        return;
      }
      const img = document.createElement('img');
      img.alt = 'Diagram for export';
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width * 2; 
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const downloadElement = document.createElement('a');
            downloadElement.setAttribute('href', url);
            downloadElement.setAttribute('download', `${fileName}.png`);
            document.body.appendChild(downloadElement);
            downloadElement.click();
            document.body.removeChild(downloadElement);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    }
    
    setShowExportMenu(null);
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
            onClick={() => handleGenerateDiagram()}
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
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setSideByView(!sideByView)}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sideByView
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Columns className="w-3 h-3" />
                  Compare
                </button>
              </div>
              
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
          </div>

          {sideByView && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Compare Diagram Types</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedForComparison.length === 0 && "Select 2 diagrams below to compare"}
                    {selectedForComparison.length === 1 && "Select 1 more diagram to compare"}
                    {selectedForComparison.length === 2 && "Comparing selected diagrams"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSideByView(false);
                    setSelectedForComparison([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {selectedForComparison.length === 2 ? (
                <div className="grid grid-cols-2 gap-4">
                  {selectedForComparison.map((diagramId, index) => {
                    const diagram = diagrams.find(d => d.id === diagramId);
                    return diagram ? (
                      <div key={diagram.id} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{diagram.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 capitalize">{diagram.type}</p>
                        <div className="border rounded bg-white overflow-hidden relative" style={{ minHeight: '300px' }}>
                          <div
                            id={`mermaid-compare-${index}`}
                            className="w-full h-full flex items-center justify-center p-4"
                          >
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Select 2 diagrams using the checkboxes below to compare them side-by-side.</p>
                </div>
              )}
            </div>
          )}
          
          {diagrams.map((diagram, index) => (
            <div key={diagram.id} className={`bg-white p-6 rounded-lg shadow-sm border transition-colors ${selectedForComparison.includes(diagram.id) ? 'ring-2 ring-purple-500 border-purple-300' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {sideByView && (
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectedForComparison.includes(diagram.id)}
                        onChange={() => handleComparisonSelection(diagram.id)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                    </div>
                  )}
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
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setZoomLevel(prev => ({ ...prev, [diagram.id]: Math.max(0.1, (prev[diagram.id] || 1) - 0.2) }))}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-gray-600 px-1 min-w-[40px] text-center">
                      {Math.round((zoomLevel[diagram.id] || 1) * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(prev => ({ ...prev, [diagram.id]: Math.min(3, (prev[diagram.id] || 1) + 0.2) }))}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setZoomLevel(prev => ({ ...prev, [diagram.id]: 1 }));
                        setPanPosition(prev => ({ ...prev, [diagram.id]: { x: 0, y: 0 } }));
                      }}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Reset View"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => setFullscreenDiagram(diagram.id)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => handleRegenerateDiagram(diagram, 'detailed')}
                      disabled={isRegenerating === diagram.id}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      title="Make more detailed"
                    >
                      <Plus className="w-3 h-3" />
                      Detailed
                    </button>
                    <button
                      onClick={() => handleRegenerateDiagram(diagram, 'simplified')}
                      disabled={isRegenerating === diagram.id}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                      title="Simplify diagram"
                    >
                      <Minus className="w-3 h-3" />
                      Simplify
                    </button>
                  </div>
                      
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(showExportMenu === diagram.id ? null : diagram.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Export
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showExportMenu === diagram.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                        <button
                          onClick={() => downloadDiagram(diagram, 'png')}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md"
                        >
                          <Image className="w-3 h-3" />
                          PNG Image
                        </button>
                        <button
                          onClick={() => downloadDiagram(diagram, 'svg')}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FileText className="w-3 h-3" />
                          SVG Vector
                        </button>
                        <button
                          onClick={() => downloadDiagram(diagram, 'mmd')}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-md"
                        >
                          <Code2 className="w-3 h-3" />
                          Mermaid Code
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div 
                className="border rounded-lg p-4 bg-white overflow-hidden relative"
                style={{ minHeight: '200px' }}
              >
                <div
                  id={`mermaid-${index}`}
                  className="flex items-center justify-center w-full h-full cursor-move transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel[diagram.id] || 1}) translate(${(panPosition[diagram.id]?.x || 0)}px, ${(panPosition[diagram.id]?.y || 0)}px)`,
                    transformOrigin: 'center',
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX - (panPosition[diagram.id]?.x || 0);
                    const startY = e.clientY - (panPosition[diagram.id]?.y || 0);
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      setPanPosition(prev => ({
                        ...prev,
                        [diagram.id]: {
                          x: e.clientX - startX,
                          y: e.clientY - startY,
                        },
                      }));
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                </div>
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

      {fullscreenDiagram && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="w-full h-full p-8 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <h3 className="text-xl font-semibold">
                  {diagrams.find(d => d.id === fullscreenDiagram)?.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white bg-opacity-20 rounded-md p-1">
                  <button
                    onClick={() => setZoomLevel(prev => ({ ...prev, [fullscreenDiagram]: Math.max(0.1, (prev[fullscreenDiagram] || 1) - 0.2) }))}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-white px-2 min-w-[50px] text-center">
                    {Math.round((zoomLevel[fullscreenDiagram] || 1) * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => ({ ...prev, [fullscreenDiagram]: Math.min(5, (prev[fullscreenDiagram] || 1) + 0.2) }))}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(prev => ({ ...prev, [fullscreenDiagram]: 1 }));
                      setPanPosition(prev => ({ ...prev, [fullscreenDiagram]: { x: 0, y: 0 } }));
                    }}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setFullscreenDiagram(null)}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-md"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-white rounded-lg overflow-hidden relative">
              <div
                id={`mermaid-fullscreen`}
                className="w-full h-full flex items-center justify-center cursor-move transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel[fullscreenDiagram] || 1}) translate(${(panPosition[fullscreenDiagram]?.x || 0)}px, ${(panPosition[fullscreenDiagram]?.y || 0)}px)`,
                  transformOrigin: 'center',
                }}
                onMouseDown={(e) => {
                  const startX = e.clientX - (panPosition[fullscreenDiagram]?.x || 0);
                  const startY = e.clientY - (panPosition[fullscreenDiagram]?.y || 0);
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    setPanPosition(prev => ({
                      ...prev,
                      [fullscreenDiagram]: {
                        x: e.clientX - startX,
                        y: e.clientY - startY,
                      },
                    }));
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}