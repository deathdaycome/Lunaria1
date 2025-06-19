import { ReactNode, useEffect, useState } from "react";
import BottomNav from "./bottom-nav";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import ThemeSwitcher from "@/components/shared/theme-switcher";

// Extend Window interface to include Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        expand: () => void;
        disableVerticalSwipes: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

type MainLayoutProps = {
  children: ReactNode;
  title: string;
  activeTab: "horoscope" | "tarot" | "compatibility" | "subscription" | "settings" | "natal-chart";
  showRefresh?: boolean;
  onRefresh?: () => void;
  showHeader?: boolean;
};

export default function MainLayout({
  children,
  title,
  activeTab,
  showRefresh = false,
  onRefresh,
  showHeader = true
}: MainLayoutProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // ✅ TELEGRAM WEBAPP ЗАЩИТА ОТ PULL-TO-REFRESH
    const initTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Разворачиваем приложение на весь экран
        tg.expand();
        
        // Отключаем pull-to-refresh
        tg.disableVerticalSwipes();
        
        // Устанавливаем тему
        tg.setHeaderColor('#1a1a2e');
        tg.setBackgroundColor('#1a1a2e');
        
        console.log('✅ Telegram WebApp initialized');
      }
    };

    // ✅ ЗАЩИТА ОТ PULL-TO-REFRESH НА УРОВНЕ БРАУЗЕРА
    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('[data-scroll-container]') || document.documentElement;
      
      // Если скроллим в самом верху и тянем вниз - блокируем
      if (scrollContainer.scrollTop === 0 && e.touches[0].clientY > (e as any).startY) {
        e.preventDefault();
      }
    };

    // ✅ БЛОКИРОВКА OVERSCROLL
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('[data-scroll-container]') || document.documentElement;
      
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      
      // Блокируем скролл за пределы контента
      if ((scrollTop === 0 && (e as any).deltaY < 0) || 
          (scrollTop + clientHeight >= scrollHeight && (e as any).deltaY > 0)) {
        e.preventDefault();
      }
    };

    // Определяем viewport изменения
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const screenHeight = window.screen.height;
        const heightDifference = screenHeight - currentHeight;
        
        setIsKeyboardVisible(heightDifference > 150);
        
        setIsFullScreen(
          window.innerHeight === window.screen.height ||
          document.fullscreenElement !== null ||
          // @ts-ignore
          window.navigator.standalone === true
        );
      }
    };

    // Инициализация
    initTelegramWebApp();
    
    // Добавляем слушатели
    let startY = 0;
    
    const touchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      (e as any).startY = startY;
    };

    const touchMove = (e: TouchEvent) => {
      (e as any).startY = startY;
      preventPullToRefresh(e);
    };

    // Слушатели событий
    document.addEventListener('touchstart', touchStart, { passive: false });
    document.addEventListener('touchmove', touchMove, { passive: false });
    // ✅ ДОЛЖНО БЫТЬ:
    const preventOverscrollWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('[data-scroll-container]') || document.documentElement;
      
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      
      // Блокируем скролл за пределы контента
      if ((scrollTop === 0 && e.deltaY < 0) || 
          (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
        e.preventDefault();
      }
    };

    // И замените строку addEventListener:
    document.addEventListener('wheel', preventOverscrollWheel, { passive: false });
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    
    window.addEventListener('resize', handleViewportChange);
    handleViewportChange();

    return () => {
      document.removeEventListener('touchstart', touchStart);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('wheel', preventOverscrollWheel);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  return (
    <div 
      className="max-w-md mx-auto min-h-screen relative w-full overflow-x-hidden"
      data-scroll-container // ✅ МАРКЕР ДЛЯ СКРОЛЛ-КОНТЕЙНЕРА
      style={{
        paddingBottom: isKeyboardVisible ? '1rem' : '5rem',
        paddingTop: isFullScreen && showHeader ? 'env(safe-area-inset-top, 0px)' : '0px',
        transition: 'padding 0.3s ease-in-out',
        minHeight: '100dvh',
        // ✅ ЗАЩИТА ОТ OVERSCROLL
        overscrollBehavior: 'none',
        // ✅ WEBKIT СПЕЦИФИЧНЫЕ СТИЛИ
        WebkitOverflowScrolling: 'touch',
        // ✅ ПРЕДОТВРАЩАЕМ PULL-TO-REFRESH
        touchAction: 'pan-x pan-y',
      }}
    >
      {/* Header */}
      {showHeader && (
        <div className={`sticky top-0 z-10 mb-4 ${isFullScreen ? 'safe-area-top' : ''}`}>
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[rgba(155,89,182,0.15)]" 
              style={{filter: "blur(35px)"}} />
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[rgba(84,40,176,0.2)]" 
              style={{filter: "blur(30px)"}} />
              
          <div className="p-4 flex items-center justify-between relative overflow-hidden rounded-b-2xl
                        bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background-tertiary)] backdrop-blur-lg
                        shadow-[0_5px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]
                        border-b border-x border-[var(--border)]"
                style={{
                  paddingTop: isFullScreen 
                    ? 'max(1rem, calc(env(safe-area-inset-top, 0px) + 1rem))' 
                    : '1rem',
                  marginTop: isFullScreen ? '0px' : '0px',
                }}>
            
            <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[rgba(155,89,182,0.5)] to-transparent"></div>
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[rgba(155,89,182,0.3)] to-transparent opacity-50"></div>
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[rgba(177,151,252,0.1)] to-transparent"></div>
            
            <div className="flex-1 flex justify-center">
              <h1 className="font-connie text-xl font-bold relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e2e2f0] relative z-10"
                      style={{
                        textShadow: "0 0 10px rgba(177,151,252,0.5), 0 2px 3px rgba(0,0,0,0.5)"
                      }}>
                  {title}
                </span>
              </h1>
            </div>
            
            <div className="flex gap-2 relative z-10">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <ThemeSwitcher className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/30
                              border border-[var(--border)] shadow-[0_4px_10px_rgba(0,0,0,0.25)]
                              hover:shadow-[var(--shadow-glow)]
                              transition-all duration-300" />
              </motion.div>
              
              {showRefresh && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="rounded-full w-9 h-9 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/30
                              border border-[var(--border)] shadow-[0_4px_10px_rgba(0,0,0,0.25)]
                              hover:shadow-[var(--shadow-glow)]
                              transition-all duration-300"
                    onClick={onRefresh}
                    style={{
                      backdropFilter: "blur(5px)"
                    }}
                  >
                    <RefreshCw className="h-4 w-4 text-[var(--foreground)] drop-shadow-md" />
                  </Button>
                </motion.div>
              )}
              
              {activeTab !== "settings" && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/settings">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="rounded-full w-9 h-9 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/30
                                border border-[var(--border)] shadow-[0_4px_10px_rgba(0,0,0,0.25)]
                                hover:shadow-[var(--shadow-glow)]
                                transition-all duration-300"
                      style={{
                        backdropFilter: "blur(5px)"
                      }}
                    >
                      <Settings className="h-4 w-4 text-[var(--foreground)] drop-shadow-md" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ MAIN CONTENT С ЗАЩИТОЙ ОТ OVERSCROLL */}
      <div 
        className="px-2 sm:px-6 py-4"
        style={{
          // ✅ ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА ОТ PULL-TO-REFRESH
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* Bottom Navigation */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-20 transition-transform duration-300 ${
          isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <BottomNav activeTab={activeTab} />
      </div>
    </div>
  );
}