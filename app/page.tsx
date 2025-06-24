'use client';

import { useState, useEffect } from 'react';
import { Brain, FileText, MessageSquare, GitBranch, Mic, Upload, Search, Download, Lightbulb, Copy, CheckSquare, Calendar, Plus, Flag, Clock } from 'lucide-react';
import AudioManager from './components/audio-input/AudioManager';
import ProcessingStatus from './components/ui/ProcessingStatus';
import TranscriptionViewer from './components/TranscriptionViewer';
import ChatInterface from './components/ChatInterface';
import DiagramViewer from './components/DiagramViewer';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import ExportManager from './components/ExportManager';
import { CardSkeleton, TranscriptionSkeleton } from './components/ui/LoadingSkeleton';
import { AudioSource, Transcription, AnalysisResult } from './types';
import { useTranscription } from './hooks/useTranscription';
import { useSearch } from './hooks/useSearch';
import { SessionStorage } from './lib/storage';
import { generateUniqueId } from './lib/audio-utils';
import Image from 'next/image';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentAudioSource, setCurrentAudioSource] = useState<AudioSource | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState<Transcription | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'transcription' | 'analysis' | 'chat' | 'diagrams' | 'search'>('input');
  const [showExportManager, setShowExportManager] = useState(false);
  
  const { status, transcribeFile, transcribeYouTube, analyzeText, generateActionItems, reset } = useTranscription();
  const {
    searchState,
    searchStats,
    performSearch,
    searchByTime,
    navigateResults,
    clearSearch,
  } = useSearch();

  const [isGeneratingActionItems, setIsGeneratingActionItems] = useState(false);

  useEffect(() => {
    SessionStorage.initialize();
  }, []);

  const handleGetStarted = () => {
    setShowWelcome(false);
  };

  const handleAudioSourceReady = async (audioSource: AudioSource) => {
    setCurrentAudioSource(audioSource);
    SessionStorage.saveCurrentAudioSource(audioSource);
    
    setActiveTab('transcription');
    
    try {
      let transcriptionResult;
      
      if (audioSource.type === 'youtube') {
        transcriptionResult = await transcribeYouTube(audioSource.url!, 'en');
      } else if (audioSource.type === 'upload' && audioSource.fileName) {
        const fileData = SessionStorage.getCurrentAudioFile();
        if (fileData) {
          const blob = new Blob([fileData.buffer], { type: fileData.mimeType });
          const file = new File([blob], audioSource.fileName, { type: fileData.mimeType });
          const transcription = await transcribeFile(file, 'en');
          transcriptionResult = { transcription };
        } else {
          throw new Error('Audio file data not found');
        }
      } else if (audioSource.type === 'recording') {
        const audioData = SessionStorage.getCurrentAudioBlob();
        if (audioData) {
          const file = new File([audioData.blob], `recording-${audioSource.id}.webm`, { type: audioData.blob.type });
          const transcription = await transcribeFile(file, 'en');
          transcriptionResult = { transcription };
        } else {
          throw new Error('Recording data not found');
        }
      } else {
        throw new Error('Unsupported audio source type');
      }
      
      const transcription: Transcription = {
        id: generateUniqueId(),
        audioSourceId: audioSource.id,
        text: transcriptionResult.transcription.text,
        segments: transcriptionResult.transcription.segments || [],
        language: transcriptionResult.transcription.language || 'en',
        confidence: transcriptionResult.transcription.confidence || 0.9,
        createdAt: new Date(),
      };
      
      setCurrentTranscription(transcription);
      SessionStorage.saveCurrentTranscription(transcription);
      
      const analysis = await analyzeText(transcription.text, false);
      const analysisResult: AnalysisResult = {
        id: generateUniqueId(),
        transcriptionId: transcription.id,
        keyNotes: analysis.keyNotes,
        summary: analysis.summary,
        topics: analysis.topics,
        sentiment: analysis.sentiment,
        createdAt: new Date(),
      };
      
      setCurrentAnalysis(analysisResult);
      SessionStorage.saveCurrentAnalysis(analysisResult);
      
      setActiveTab('analysis');
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const handleGenerateActionItems = async () => {
    if (!currentTranscription || !currentAnalysis) return;
    
    setIsGeneratingActionItems(true);
    try {
      const actionItems = await generateActionItems(currentTranscription.text);
      const updatedAnalysis: AnalysisResult = {
        ...currentAnalysis,
        actionItems: actionItems,
      };
      
      setCurrentAnalysis(updatedAnalysis);
      SessionStorage.saveCurrentAnalysis(updatedAnalysis);
    } catch (error) {
      console.error('Error generating action items:', error);
    } finally {
      setIsGeneratingActionItems(false);
    }
  };

  const resetApplication = () => {
    setCurrentAudioSource(null);
    setCurrentTranscription(null);
    setCurrentAnalysis(null);
    setActiveTab('input');
    SessionStorage.resetCurrentSession();
    reset();
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Cerebral Logo" 
                  width={40} 
                  height={40} 
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold text-slate-900 tracking-tight">Cerebral</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
                <a href="#about" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">About</a>
              </div>
            </div>
          </div>
        </nav>

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                Convert conversations into
                <span className="text-purple-500 block">intelligent insights</span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
                Accurate transcription, intelligent analysis, and interactive chat for meetings, lectures, interviews, and podcasts.
              </p>
              
              <div className="flex justify-center">
                <button
                  onClick={handleGetStarted}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Start Processing Audio
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Everything you need</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">Powerful features designed for professionals who work with audio content</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Mic className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Multiple Input Sources</h3>
                <p className="text-slate-600 text-base leading-relaxed mb-6">Upload files, record live audio, or extract from YouTube videos with professional-grade processing.</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Live recording with pause/resume
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Drag & drop file uploads
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    YouTube video processing
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Intelligent Analysis</h3>
                <p className="text-slate-600 text-base leading-relaxed mb-6">Advanced AI extracts key insights, summaries, and actionable items from your transcriptions.</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Automatic summarization
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Topic extraction & tagging
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Sentiment analysis
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Interactive Chat</h3>
                <p className="text-slate-600 text-base leading-relaxed mb-6">Chat naturally with your content, ask questions, and generate visual diagrams.</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Natural language queries
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Contextual responses
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Mermaid diagram generation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-slate-50 border-t border-slate-200 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <Image 
                  src="/logo.png" 
                  alt="Cerebral Logo" 
                  width={32} 
                  height={32} 
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-slate-900">Cerebral</span>
              </div>
              <div className="text-slate-600 text-sm">
                © 2024 Cerebral. Built for intelligent audio processing.
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <Image 
                src="/logo.png" 
                alt="Cerebral Logo" 
                width={40} 
                height={40} 
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Cerebral</h1>
            </div>
            
            {currentAudioSource && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportManager(true)}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 font-semibold border border-purple-200 min-h-[44px] touch-manipulation flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={resetApplication}
                  className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200 font-semibold border border-slate-200 min-h-[44px] touch-manipulation"
                >
                  <span className="hidden sm:inline">New Session</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {currentAudioSource && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <nav className="flex space-x-0 overflow-x-auto scrollbar-hide">
              {[
                { id: 'input', name: 'Input', icon: Upload },
                { id: 'transcription', name: 'Transcription', icon: FileText },
                { id: 'analysis', name: 'Analysis', icon: Brain },
                { id: 'chat', name: 'Chat', icon: MessageSquare },
                { id: 'diagrams', name: 'Diagrams', icon: GitBranch },
                { id: 'search', name: 'Search', icon: Search },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`
                      flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold transition-all duration-200 border-b-3 whitespace-nowrap min-h-[48px] touch-manipulation
                      ${isActive
                        ? 'border-purple-500 text-purple-500 bg-purple-50/50'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      {!currentAudioSource && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
              <Image 
                src="/logo.png" 
                alt="Cerebral Logo" 
                width={40} 
                height={40} 
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">Welcome to Cerebral</h2>
            <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto font-medium leading-relaxed px-4 sm:px-0">
              Upload audio files, record live, or process YouTube videos to get started with AI-powered transcription and analysis.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        {status.stage !== 'completed' && (
          <div className="mb-6">
            <ProcessingStatus status={status} />
          </div>
        )}

        {activeTab === 'input' && (
          <AudioManager
            onAudioSourceReady={handleAudioSourceReady}
            disabled={status.stage !== 'completed'}
          />
        )}

        {activeTab === 'transcription' && (
          <>
            {currentTranscription ? (
              <TranscriptionViewer
                transcription={currentTranscription}
                audioSource={currentAudioSource!}
                onTranscriptionUpdate={setCurrentTranscription}
              />
            ) : status.stage === 'transcribing' ? (
              <TranscriptionSkeleton />
            ) : (
              <div className="bg-white p-16 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">No Transcription Available</h2>
                <p className="text-slate-600 font-medium">Process an audio source to view AI-powered transcription.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'analysis' && (
          <>
            {currentAnalysis ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analysis Results</h2>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4 text-slate-900">Summary</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <span className="font-bold text-base text-blue-700 block mb-2">Brief Summary</span>
                      <span className="text-base text-slate-800 leading-relaxed">{currentAnalysis.summary.brief}</span>
                    </div>
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <span className="font-bold text-base text-green-700 block mb-2">Detailed Analysis</span>
                      <span className="text-base text-slate-800 leading-relaxed">{currentAnalysis.summary.detailed}</span>
                    </div>
                  </div>
                </div>

                {currentAnalysis.keyNotes.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Key Notes</h3>
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {currentAnalysis.keyNotes.length} insights
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {currentAnalysis.keyNotes.map((note, index) => (
                        <div key={index} className="group bg-gradient-to-r from-orange-50 to-orange-25 hover:from-orange-100 hover:to-orange-50 p-6 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base text-slate-800 leading-relaxed font-medium group-hover:text-slate-900 transition-colors">
                                {note}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => navigator.clipboard.writeText(note)}
                                className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                title="Copy note"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {currentAnalysis.topics.length > 0 && (
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                      <h3 className="text-lg font-bold mb-4 text-slate-900">Topics</h3>
                      <div className="flex flex-wrap gap-3">
                        {currentAnalysis.topics.map((topic, index) => (
                          <span key={index} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                    <h3 className="text-lg font-bold mb-4 text-slate-900">Sentiment</h3>
                    <span className={`px-6 py-3 rounded-lg text-base font-bold ${
                      currentAnalysis.sentiment === 'positive' ? 'bg-green-600 text-white' :
                      currentAnalysis.sentiment === 'negative' ? 'bg-red-600 text-white' :
                      'bg-slate-600 text-white'
                    }`}>
                      {currentAnalysis.sentiment.charAt(0).toUpperCase() + currentAnalysis.sentiment.slice(1)}
                    </span>
                  </div>
                </div>
                        
                {currentAnalysis.actionItems && currentAnalysis.actionItems.length > 0 ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Action Items</h3>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {currentAnalysis.actionItems.length} tasks
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                          Export as TODO
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors">
                          <Calendar className="w-4 h-4" />
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {currentAnalysis.actionItems.map((item, index) => (
                        <div key={index} className="group bg-white hover:bg-blue-25 p-5 rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 text-blue-600 bg-white border-2 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 hover:border-blue-400 transition-colors cursor-pointer"
                                onChange={(e) => {    
                                  e.target.parentElement?.parentElement?.classList.toggle('opacity-60', e.target.checked);
                                  e.target.parentElement?.parentElement?.querySelector('.action-text')?.classList.toggle('line-through', e.target.checked);
                                }}
                              />
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="action-text text-base text-slate-800 leading-relaxed font-medium group-hover:text-slate-900 transition-colors">
                                {item}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => navigator.clipboard.writeText(item)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Copy action item"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Set priority"
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Add deadline"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">
                          Track your progress and stay organized
                        </span>
                        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                          <Plus className="w-4 h-4" />
                          Add custom action
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">No Action Items Generated</h3>
                      <p className="text-slate-600 mb-6">Extract actionable tasks and to-dos from your transcribed content using AI analysis.</p>
                      <button 
                        onClick={handleGenerateActionItems}
                        disabled={isGeneratingActionItems}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
                      >
                        {isGeneratingActionItems ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4" />
                            Generate Action Items
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : status.stage === 'analyzing' ? (
              <CardSkeleton />
            ) : (
              <div className="bg-white p-16 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">No Analysis Available</h2>
                <p className="text-slate-600 font-medium">Process an audio source to view intelligent AI analysis.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'chat' && (
          <>
            {currentTranscription ? (
              <ChatInterface
                transcription={currentTranscription}
              />
            ) : (
              <div className="bg-white p-16 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">No Content to Chat With</h2>
                <p className="text-slate-600 font-medium">Process an audio source to start intelligent conversations.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'diagrams' && (
          <>
            {currentTranscription ? (
              <DiagramViewer
                transcriptionText={currentTranscription.text}
                transcriptionId={currentTranscription.id}
              />
            ) : (
              <div className="bg-white p-16 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <GitBranch className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">No Content for Diagrams</h2>
                <p className="text-slate-600 font-medium">Process an audio source to generate visual diagrams.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Search All Content</h2>
              </div>

              <SearchBar
                onSearch={(query: string, filters?: import('./types').SearchFilters) => performSearch(query, currentTranscription, filters)}
                onTimeSearch={(startTime: number, endTime: number) => searchByTime(startTime, endTime, currentTranscription)}
                onClear={clearSearch}
                isSearching={searchState.isSearching}
                searchStats={searchStats}
                onNavigate={navigateResults}
                placeholder="Search in current transcription..."
              />
            </div>

            {searchState.results.length > 0 && (
              <SearchResults
                results={searchState.results}
                currentResultIndex={searchState.currentResultIndex}
                searchQuery={searchState.query}
                currentTranscription={currentTranscription}
                currentAudioSource={currentAudioSource}
                onResultClick={() => {
                  setActiveTab('transcription');
                }}
                onJumpToTime={() => { 
                  setActiveTab('transcription');
                }}
              />
            )}

            {searchState.query && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {searchState.results.length === 0 
                      ? 'No results found' 
                      : `Found ${searchState.results.length} result${searchState.results.length !== 1 ? 's' : ''}`
                    }
                  </span>
                  {searchState.results.length > 0 && (
                    <span className="text-slate-500">
                      Use Ctrl+↑/↓ to navigate results
                    </span>
                  )}
                </div>
              </div>
            )}

            {!currentTranscription && (
              <div className="bg-white p-16 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">No Content to Search</h2>
                <p className="text-slate-600 font-medium">Process an audio source to start searching through transcriptions.</p>
              </div>
            )}
          </div>
        )}

      </main>

      {showExportManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ExportManager
              transcription={currentTranscription || undefined}
              audioSource={currentAudioSource || undefined}
              analysis={currentAnalysis || undefined}
              onClose={() => setShowExportManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}