// hooks/use-performance-mode.ts  
import { useState, useEffect } from 'react';

interface PerformanceSettings {
  reducedMotion: boolean;
  isMobile: boolean;
  isLowPerformance: boolean;
  shouldReduceAnimations: boolean;
  isTelegramWebApp: boolean;
  deviceTier: 'high' | 'medium' | 'low';
}

export function usePerformanceMode(): PerformanceSettings {
  const [settings, setSettings] = useState<PerformanceSettings>({
    reducedMotion: false,
    isMobile: false,
    isLowPerformance: false,
    shouldReduceAnimations: false,
    isTelegramWebApp: false,
    deviceTier: 'high',
  });

  useEffect(() => {
    // Определение характеристик устройства (только при загрузке)
    const determineDeviceTier = (): 'high' | 'medium' | 'low' => {
      const memory = (navigator as any).deviceMemory;
      const cores = navigator.hardwareConcurrency || 2;
      
      // Определяем tier на основе характеристик устройства
      if (memory >= 8 && cores >= 4) return 'high';
      if (memory >= 4 || cores >= 2) return 'medium';
      return 'low';
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
    const isTelegramWebApp = !!(window as any).Telegram?.WebApp?.platform;
    
    const deviceTier = determineDeviceTier();
    
    // ИСПРАВЛЕНО: Определяем isLowPerformance только для информации, НЕ для автопереключения
    const connection = (navigator as any).connection;
    const isLowPerformance = deviceTier === 'low' || 
      (connection?.effectiveType === 'slow-2g') ||
      (connection?.effectiveType === '2g');

    // ИСПРАВЛЕНО: shouldReduceAnimations основывается только на настройках пользователя и базовых характеристиках
    // НЕ на текущей производительности
    const shouldReduceAnimations = prefersReducedMotion || 
                                  (isMobile && deviceTier === 'low' && prefersReducedMotion);

    setSettings({
      reducedMotion: prefersReducedMotion,
      isMobile,
      isLowPerformance: !!isLowPerformance,
      shouldReduceAnimations,
      isTelegramWebApp,
      deviceTier,
    });

    // ИСПРАВЛЕНО: Применяем только базовые CSS классы, НЕ performance-*
    const documentClasses = document.documentElement.classList;
    
    // Применяем класс редуцированных анимаций ТОЛЬКО если пользователь этого хочет
    if (shouldReduceAnimations) {
      documentClasses.add('reduced-animations');
      console.log('🎛️ Включены редуцированные анимации (настройки пользователя)');
    } else {
      documentClasses.remove('reduced-animations');
    }

    // Применяем классы окружения
    if (isTelegramWebApp) {
      documentClasses.add('tg-viewport');
      document.body.classList.add('telegram-webapp');
      console.log('📱 Обнаружен Telegram WebApp');
    }

    if (isMobile) {
      documentClasses.add('mobile-device');
      console.log('📱 Обнаружено мобильное устройство');
    }

    // Применяем класс tier устройства (для постоянной адаптации)
    documentClasses.add(`device-tier-${deviceTier}`);
    console.log(`💻 Tier устройства: ${deviceTier.toUpperCase()}`);

    // ПРИНУДИТЕЛЬНО устанавливаем высокую производительность НАВСЕГДА
    documentClasses.remove('performance-medium', 'performance-low', 'performance-ultra-low');
    documentClasses.add('performance-high');
    console.log('🚀 НАВСЕГДА установлен режим performance-high');

    // УБРАНО: Автоматическое переключение в ultra-low режим
    // Теперь только device-tier-* классы влияют на адаптацию

    // Отслеживаем ТОЛЬКО изменения настроек доступности пользователя
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      const newReducedMotion = mediaQuery.matches;
      // ИСПРАВЛЕНО: Новая логика основана только на настройках пользователя
      const newShouldReduce = newReducedMotion || 
                             (isMobile && deviceTier === 'low' && newReducedMotion);
      
      setSettings(prev => ({
        ...prev,
        reducedMotion: newReducedMotion,
        shouldReduceAnimations: newShouldReduce,
      }));

      if (newShouldReduce) {
        documentClasses.add('reduced-animations');
        console.log('🎛️ Пользователь включил редуцированные анимации');
      } else {
        documentClasses.remove('reduced-animations');
        console.log('🎛️ Пользователь отключил редуцированные анимации');
      }

      // ДОБАВЛЕНО: Поддерживаем performance-high при любых изменениях
      documentClasses.remove('performance-medium', 'performance-low', 'performance-ultra-low');
      documentClasses.add('performance-high');
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      // ИСПРАВЛЕНО: Очищаем только некритичные классы
      documentClasses.remove('reduced-animations', 'tg-viewport', 'mobile-device', `device-tier-${deviceTier}`);
      document.body.classList.remove('telegram-webapp');
      // НЕ УДАЛЯЕМ performance-high - оставляем навсегда
    };
  }, []);

  return settings;
}

export function useAnimationController() {
  const { shouldReduceAnimations, deviceTier } = usePerformanceMode();

  const getAnimationClass = (normalClass: string, reducedClass?: string) => {
    return shouldReduceAnimations ? (reducedClass || '') : normalClass;
  };

  const conditionalStyle = (normalStyle: React.CSSProperties, reducedStyle?: React.CSSProperties) => {
    return shouldReduceAnimations ? (reducedStyle || {}) : normalStyle;
  };

  // ИСПРАВЛЕНО: Убрали автоматическое замедление анимаций для medium устройств
  const getAnimationDuration = (normal: number, reduced?: number) => {
    if (shouldReduceAnimations) return reduced || 0;
    // УБРАНО: if (deviceTier === 'medium') return normal * 0.7;
    return normal; // Всегда нормальная скорость, если пользователь не просил редуцированные анимации
  };

  return {
    shouldReduceAnimations,
    deviceTier,
    getAnimationClass,
    conditionalStyle,
    getAnimationDuration,
  };
}