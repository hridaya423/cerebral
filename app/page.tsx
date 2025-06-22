'use client';

import { useState } from 'react';
import { Brain, FileText, MessageSquare, GitBranch, Mic, Upload} from 'lucide-react';
import AudioManager from './components/audio-input/AudioManager';
import ProcessingStatus from './components/ui/ProcessingStatus';
import TranscriptionViewer from './components/TranscriptionViewer';
import ChatInterface from './components/ChatInterface';
import DiagramViewer from './components/DiagramViewer';
import { CardSkeleton, TranscriptionSkeleton } from './components/ui/LoadingSkeleton';
import { AudioSource, Transcription, AnalysisResult } from './types';
import { useTranscription } from './hooks/useTranscription';
import { LocalStorage } from './lib/storage';
import { generateUniqueId } from './lib/audio-utils';
import Image from 'next/image';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentAudioSource, setCurrentAudioSource] = useState<AudioSource | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState<Transcription | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'transcription' | 'analysis' | 'chat' | 'diagrams'>('input');
  
  const { status, transcribeFile, transcribeYouTube, analyzeText, reset } = useTranscription();

  const handleGetStarted = () => {
    setShowWelcome(false);
  };

  const handleAudioSourceReady = async (audioSource: AudioSource) => {
    setCurrentAudioSource(audioSource);
    LocalStorage.saveAudioSource(audioSource);
    
    setActiveTab('transcription');
    
    try {
      let transcriptionResult;
      
      if (audioSource.type === 'youtube') {
        transcriptionResult = await transcribeYouTube(audioSource.url!, 'en');
      } else if (audioSource.type === 'upload' && audioSource.fileName) {
        const fileData = LocalStorage.getAudioFile(audioSource.id);
        if (fileData) {
          const blob = new Blob([fileData.buffer], { type: fileData.mimeType });
          const file = new File([blob], audioSource.fileName, { type: fileData.mimeType });
          const transcription = await transcribeFile(file, 'en');
          transcriptionResult = { transcription };
        } else {
          throw new Error('Audio file data not found');
        }
      } else if (audioSource.type === 'recording') {
        const audioData = LocalStorage.getAudioBlob(audioSource.id);
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
      LocalStorage.saveTranscription(transcription);
      
      const analysis = await analyzeText(transcription.text);
      const analysisResult: AnalysisResult = {
        id: generateUniqueId(),
        transcriptionId: transcription.id,
        keyNotes: analysis.keyNotes,
        summary: analysis.summary,
        topics: analysis.topics,
        sentiment: analysis.sentiment,
        actionItems: analysis.actionItems,
        createdAt: new Date(),
      };
      
      setCurrentAnalysis(analysisResult);
      LocalStorage.saveAnalysisResult(analysisResult);
      
      setActiveTab('analysis');
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const resetApplication = () => {
    setCurrentAudioSource(null);
    setCurrentTranscription(null);
    setCurrentAnalysis(null);
    setActiveTab('input');
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
              <button
                onClick={resetApplication}
                className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200 font-semibold border border-slate-200 min-h-[44px] touch-manipulation"
              >
                <span className="hidden sm:inline">New Session</span>
                <span className="sm:hidden">New</span>
              </button>
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
                    <h3 className="text-lg font-bold mb-4 text-slate-900">Key Notes</h3>
                    <ul className="space-y-4">
                      {currentAnalysis.keyNotes.map((note, index) => (
                        <li key={index} className="flex items-start bg-orange-50 p-6 rounded-xl border border-orange-200">
                          <span className="w-8 h-8 bg-orange-600 text-white rounded-xl flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-base text-slate-800 leading-relaxed">{note}</span>
                        </li>
                      ))}
                    </ul>
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
                        
                {currentAnalysis.actionItems.length > 0 && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold mb-4 text-slate-900">Action Items</h3>
                    <ul className="space-y-4">
                      {currentAnalysis.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="bg-blue-600 text-white text-sm rounded-lg w-8 h-8 flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 font-bold">
                            {index + 1}
                          </span>
                          <span className="text-base text-slate-800 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
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

      </main>
    </div>
  );
}