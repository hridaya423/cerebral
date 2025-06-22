'use client';

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circle' | 'line';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export default function LoadingSkeleton({ 
  variant = 'line', 
  width = 'w-full', 
  height = 'h-4', 
  className = '',
  count = 1 
}: LoadingSkeletonProps) {
  const getSkeletonClass = () => {
    const baseClasses = "bg-slate-200 rounded-lg animate-pulse";
    
    switch (variant) {
      case 'card':
        return `${baseClasses} ${width} ${height || 'h-48'}`;
      case 'text':
        return `${baseClasses} ${width} ${height || 'h-4'}`;
      case 'circle':
        return `${baseClasses} rounded-full ${width || 'w-12'} ${height || 'h-12'}`;
      case 'line':
      default:
        return `${baseClasses} ${width} ${height}`;
    }
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`${getSkeletonClass()} ${className}`}
    />
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return <div className="space-y-3">{skeletons}</div>;
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white p-8 rounded-xl shadow-sm border border-slate-200 ${className}`}>
      <div className="space-y-6">
        <LoadingSkeleton variant="text" width="w-3/4" height="h-8" />
        <LoadingSkeleton variant="text" width="w-full" count={4} />
        <LoadingSkeleton variant="text" width="w-1/2" height="h-6" />
        <div className="flex gap-4 mt-6">
          <LoadingSkeleton variant="circle" width="w-10" height="h-10" />
          <LoadingSkeleton variant="text" width="w-32" height="h-6" />
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          {i % 2 === 0 && <LoadingSkeleton variant="circle" width="w-8" height="h-8" />}
          <LoadingSkeleton 
            variant="card" 
            width={`${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} 
            height="h-16" 
          />
          {i % 2 === 1 && <LoadingSkeleton variant="circle" width="w-8" height="h-8" />}
        </div>
      ))}
    </div>
  );
}

export function TranscriptionSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white p-8 rounded-xl shadow-sm border border-slate-200 ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-6 mb-8">
          <LoadingSkeleton variant="circle" width="w-16" height="h-16" />
          <div className="flex-1 space-y-3">
            <LoadingSkeleton variant="text" width="w-1/3" height="h-8" />
            <LoadingSkeleton variant="text" width="w-1/4" height="h-6" />
          </div>
        </div>
        
        <div className="space-y-4">
          <LoadingSkeleton variant="text" width="w-full" height="h-6" count={10} />
          <LoadingSkeleton variant="text" width="w-3/4" height="h-6" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-8">
          <LoadingSkeleton variant="card" height="h-24" />
          <LoadingSkeleton variant="card" height="h-24" />
        </div>
      </div>
    </div>
  );
}

export function DiagramSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <LoadingSkeleton variant="text" width="w-1/4" height="h-6" />
          <LoadingSkeleton variant="text" width="w-20" height="h-8" />
        </div>
        
        <LoadingSkeleton variant="card" height="h-64" />
        
        <div className="flex gap-4">
          <LoadingSkeleton variant="text" width="w-16" height="h-4" />
          <LoadingSkeleton variant="text" width="w-24" height="h-4" />
        </div>
      </div>
    </div>
  );
}