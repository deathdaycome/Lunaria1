// components/PerformanceIndicator.tsx
import React from 'react';
import { usePerformanceMonitor } from '@hooks/use-performance-monitor';

export function PerformanceIndicator() {
  const { fps, memoryUsage, isLowPerformance } = usePerformanceMonitor();
  
  // Показываем индикатор только в development mode
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
      <div className={fps < 30 ? 'text-red-400' : fps < 45 ? 'text-yellow-400' : 'text-green-400'}>
        FPS: {fps}
      </div>
      {memoryUsage > 0 && (
        <div className={memoryUsage > 80 ? 'text-red-400' : 'text-white'}>
          RAM: {memoryUsage.toFixed(1)}%
        </div>
      )}
      {isLowPerformance && (
        <div className="text-red-400 font-bold">
          ⚠️ LOW PERF
        </div>
      )}
    </div>
  );
}