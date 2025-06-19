// components/PerformanceIndicator.tsx
import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '../hooks/use-performance-monitor';

export function PerformanceIndicator() {
  const { fps, memoryUsage, isLowPerformance, performanceLevel } = usePerformanceMonitor();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Показываем индикатор только в development или при нажатии специальной комбинации
    const isDev = process.env.NODE_ENV === 'development';
    const isDebugMode = localStorage.getItem('debug-performance') === 'true';
    
    setIsVisible(isDev || isDebugMode);
    
    // Скрытая комбинация для показа индикатора (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        const newState = !isVisible;
        setIsVisible(newState);
        localStorage.setItem('debug-performance', newState.toString());
        
        // Добавляем debug атрибут к HTML для CSS
        if (newState) {
          document.documentElement.setAttribute('data-debug', 'true');
        } else {
          document.documentElement.removeAttribute('data-debug');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible) return null;

  const getPerformanceColor = () => {
    switch (performanceLevel) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-orange-400';
      case 'ultra-low': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const getPerformanceIcon = () => {
    switch (performanceLevel) {
      case 'high': return '🚀';
      case 'medium': return '⚡';
      case 'low': return '🐌';
      case 'ultra-low': return '🔥';
      default: return '📊';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 backdrop-blur-sm text-white p-3 rounded-lg text-xs font-mono border border-white/20">
      <div className="flex items-center gap-2 mb-2">
        <span>{getPerformanceIcon()}</span>
        <span className={`font-bold ${getPerformanceColor()}`}>
          {performanceLevel.toUpperCase()}
        </span>
      </div>
      
      <div className={fps < 30 ? 'text-red-400' : fps < 45 ? 'text-yellow-400' : 'text-green-400'}>
        FPS: {fps}
      </div>
      
      {memoryUsage > 0 && (
        <div className={memoryUsage > 80 ? 'text-red-400' : memoryUsage > 60 ? 'text-yellow-400' : 'text-white'}>
          RAM: {memoryUsage.toFixed(1)}%
        </div>
      )}
      
      {isLowPerformance && (
        <div className="text-red-400 font-bold mt-1 text-[10px]">
          ⚠️ PERFORMANCE ISSUE
        </div>
      )}
      
      <div className="text-[10px] text-gray-400 mt-1">
        Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}