// hooks/use-performance-mode.ts
import { useState, useEffect } from 'react';

interface PerformanceSettings {
  reducedMotion: boolean;
  isMobile: boolean;
  isLowPerformance: boolean;
  shouldReduceAnimations: boolean;
  isTelegramWebApp: boolean;
}

export function usePerformanceMode(): PerformanceSettings {
  const [settings, setSettings] = useState<PerformanceSettings>({
    reducedMotion: false,
    isMobile: false,
    isLowPerformance: false,
    shouldReduceAnimations: false,
    isTelegramWebApp: false,
  });

  useEffect(() => {
    // Проверяем системные настройки доступности
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Проверяем мобильное устройство
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
    
    // Проверяем Telegram WebApp
    const isTelegramWebApp = !!(window as any).Telegram?.WebApp?.platform;
    
    // Проверяем производительность устройства
    const isLowPerformance = 
      // Слабые устройства по памяти
      ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4) ||
      // Медленное подключение
      ((navigator as any).connection?.effectiveType === 'slow-2g') ||
      ((navigator as any).connection?.effectiveType === '2g');

    const shouldReduceAnimations = prefersReducedMotion || isMobile || isTelegramWebApp;

    setSettings({
      reducedMotion: prefersReducedMotion,
      isMobile,
      isLowPerformance: !!isLowPerformance,
      shouldReduceAnimations,
      isTelegramWebApp,
    });

    // Добавляем CSS классы для условного отключения анимаций
    if (shouldReduceAnimations) {
      document.documentElement.classList.add('reduced-animations');
    } else {
      document.documentElement.classList.remove('reduced-animations');
    }

    if (isTelegramWebApp) {
      document.documentElement.classList.add('tg-viewport');
    }

    // Отслеживаем изменения настроек доступности
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: mediaQuery.matches,
        shouldReduceAnimations: mediaQuery.matches || isMobile || isTelegramWebApp,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return settings;
}

export function useAnimationController() {
  const { shouldReduceAnimations } = usePerformanceMode();

  const getAnimationClass = (normalClass: string, reducedClass?: string) => {
    return shouldReduceAnimations ? (reducedClass || '') : normalClass;
  };

  const conditionalStyle = (normalStyle: React.CSSProperties, reducedStyle?: React.CSSProperties) => {
    return shouldReduceAnimations ? (reducedStyle || {}) : normalStyle;
  };

  return {
    shouldReduceAnimations,
    getAnimationClass,
    conditionalStyle,
  };
}