// hooks/use-performance-monitor.ts
import { useEffect, useRef, useState } from 'react';
import { PerformanceMonitor } from '@utils/performance-monitor';

export function usePerformanceMonitor() {
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const [performanceData, setPerformanceData] = useState({
    fps: 60,
    memoryUsage: 0,
    isLowPerformance: false,
  });

  useEffect(() => {
    // Создаем монитор только на клиенте и если поддерживается
    if (typeof window === 'undefined') return;
    
    monitorRef.current = new PerformanceMonitor();
    
    monitorRef.current.startMonitoring({
      onLowFPS: (fps) => {
        console.warn(`🐌 Низкий FPS: ${fps}`);
        setPerformanceData(prev => ({ 
          ...prev, 
          fps, 
          isLowPerformance: fps < 30 
        }));
        
        // Автоматически включаем режим экономии
        if (fps < 20) {
          document.documentElement.classList.add('ultra-performance');
        }
      },
      
      onHighMemory: (usage) => {
        console.warn(`🧠 Высокое использование памяти: ${usage.toFixed(1)}%`);
        setPerformanceData(prev => ({ 
          ...prev, 
          memoryUsage: usage,
          isLowPerformance: usage > 90 
        }));
        
        // Принудительная сборка мусора, если доступна
        if ((window as any).gc) {
          (window as any).gc();
        }
      },
      
      onSlowFrame: (frameTime) => {
        if (frameTime > 50) { // Кадры медленнее 50ms критичны
          console.warn(`⏱️ Медленный кадр: ${frameTime.toFixed(1)}ms`);
        }
      },
    });

    return () => {
      monitorRef.current?.stopMonitoring();
    };
  }, []);

  return {
    ...performanceData,
    monitor: monitorRef.current,
  };
}