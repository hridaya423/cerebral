'use client';

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ProcessingStatus as ProcessingStatusType } from '../../types';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
}

export default function ProcessingStatus({ status }: ProcessingStatusProps) {
  const getStatusIcon = () => {
    switch (status.stage) {
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.stage) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-purple-100 bg-purple-50';
    }
  };

  const getStatusMessage = () => {
    if (status.message) return status.message;
    
    switch (status.stage) {
      case 'uploading':
        return 'Uploading audio...';
      case 'transcribing':
        return 'Transcribing audio...';
      case 'analyzing':
        return 'Analyzing content...';
      case 'completed':
        return 'Processing complete!';
      case 'error':
        return status.error || 'An error occurred';
      default:
        return 'Processing...';
    }
  };

  if (status.stage === 'completed' && !status.message) {
    return null;
  }

  return (
    <div className={`border rounded-xl p-6 ${getStatusColor()} shadow-sm transition-all duration-200`}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base text-slate-900">{getStatusMessage()}</p>
          {status.stage !== 'error' && status.stage !== 'completed' && (
            <div className="mt-3">
              <div className="bg-white rounded-full h-2 overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 font-medium mt-2">{status.progress}% complete</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}