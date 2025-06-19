// hooks/use-performance-monitor.ts
import { useEffect, useRef, useState } from 'react';
import { PerformanceMonitor } from './performance-monitor';

export function usePerformanceMonitor() {
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const [performanceData, setPerformanceData] = useState({
    fps: 60,
    memoryUsage: 0,
    isLowPerformance: false,
    performanceLevel: 'high' as 'high' | 'medium' | 'low' | 'ultra-low'
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    monitorRef.current = new PerformanceMonitor();

    // ТОЛЬКО МОНИТОРИНГ ДЛЯ ОТОБРАЖЕНИЯ СТАТИСТИКИ - БЕЗ ИЗМЕНЕНИЯ РЕЖИМОВ
    monitorRef.current.startMonitoring({
      onLowFPS: (fps) => {
        // Только обновляем данные для индикатора, НЕ МЕНЯЕМ CSS классы
        console.log(`📊 FPS: ${fps}`);
        setPerformanceData(prev => ({
          ...prev,
          fps,
          isLowPerformance: fps < 30,
          // performanceLevel всегда остается 'high'
        }));
      },
      
      onHighMemory: (usage) => {
        // Только обновляем данные для индикатора, НЕ МЕНЯЕМ CSS классы
        console.log(`📊 RAM: ${usage.toFixed(1)}%`);
        setPerformanceData(prev => ({
          ...prev,
          memoryUsage: usage,
          isLowPerformance: usage > 90,
          // performanceLevel всегда остается 'high'
        }));
        
        // Принудительная сборка мусора только в критических случаях
        if (usage > 98 && (window as any).gc) {
          (window as any).gc();
          console.log('🗑️ Принудительная сборка мусора');
        }
      },
      
      onSlowFrame: (frameTime) => {
        // Только логирование
        if (frameTime > 100) {
          console.log(`📊 Медленный кадр: ${frameTime.toFixed(1)}ms`);
        }
      },
    });

    // ПРИНУДИТЕЛЬНО устанавливаем и навсегда фиксируем режим высокой производительности
    const setHighPerformanceForever = () => {
      // Удаляем все классы производительности
      document.documentElement.classList.remove(
        'performance-medium', 'performance-low', 'performance-ultra-low'
      );
      
      // Устанавливаем только высокую производительность НАВСЕГДА
      document.documentElement.classList.add('performance-high');
      
      console.log('🚀 НАВСЕГДА установлен режим HIGH PERFORMANCE');
    };

    // Устанавливаем высокую производительность сразу и навсегда
    setHighPerformanceForever();

    // УБИРАЕМ интервал проверки - больше не нужен

    // Простой обработчик для логирования (без изменения режимов)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Вкладка активна (режим производительности не изменяется)');
      } else {
        console.log('👁️ Вкладка неактивна (режим производительности не изменяется)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      monitorRef.current?.stopMonitoring();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // НЕ ОЧИЩАЕМ классы производительности при размонтировании!
      // Оставляем performance-high навсегда
    };
  }, []);

  // Метод для принудительного сброса (если понадобится отладка)
  const resetPerformance = () => {
    console.log('🔄 Принудительное поддержание высокой производительности');
    
    // Убираем все классы кроме high
    document.documentElement.classList.remove(
      'performance-medium', 'performance-low', 'performance-ultra-low'
    );
    
    // Устанавливаем высокую производительность
    document.documentElement.classList.add('performance-high');
    
    // Обновляем состояние
    setPerformanceData(prev => ({
      ...prev,
      performanceLevel: 'high'
    }));
  };

  return {
    ...performanceData,
    monitor: monitorRef.current,
    resetPerformance,
  };
}