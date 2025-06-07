import { ReactNode, useEffect, useState } from "react";
import BottomNav from "./bottom-nav";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import ThemeSwitcher from "@/components/shared/theme-switcher";

type MainLayoutProps = {
  children: ReactNode;
  title: string;
  activeTab: "horoscope" | "tarot" | "compatibility" | "subscription" | "settings";
  showRefresh?: boolean;
  onRefresh?: () => void;
  showHeader?: boolean; // ✨ НОВЫЙ ПРОП для контроля отображения header'а
};

export default function MainLayout({
  children,
  title,
  activeTab,
  showRefresh = false,
  onRefresh,
  showHeader = true // ✨ По умолчанию header показывается
}: MainLayoutProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // ✨ ОПРЕДЕЛЯЕМ КОГДА КЛАВИАТУРА АКТИВНА
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const screenHeight = window.screen.height;
        const heightDifference = screenHeight - currentHeight;
        
        // Если разница больше 150px, считаем что клавиатура открыта
        setIsKeyboardVisible(heightDifference > 150);
      } else {
        // Fallback для старых браузеров
        const currentHeight = window.innerHeight;
        const screenHeight = window.screen.height;
        const heightDifference = screenHeight - currentHeight;
        setIsKeyboardVisible(heightDifference > 150);
      }
    };

    // Слушаем изменения viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    
    window.addEventListener('resize', handleViewportChange);

    return () => {
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
      style={{
        // ✨ АДАПТИВНЫЕ ОТСТУПЫ:
        // Когда клавиатура открыта - уменьшаем нижний отступ
        // Когда закрыта - обычный отступ для навигации
        paddingBottom: isKeyboardVisible ? '1rem' : '5rem',
        // ✨ ПЛАВНЫЙ ПЕРЕХОД ПРИ ИЗМЕНЕНИИ ОТСТУПОВ
        transition: 'padding-bottom 0.3s ease-in-out',
        // ✨ ИСПОЛЬЗУЕМ СОВРЕМЕННЫЕ CSS-ФУНКЦИИ ДЛЯ ВЫСОТЫ
        minHeight: '100dvh', // dvh = dynamic viewport height
      }}
    >
      {/* Header - показываем только если showHeader = true */}
      {showHeader && (
        <div className="sticky top-0 z-10 mb-4 safe-area-top">
          {/* Блики и свечение по краям заголовка */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[rgba(155,89,182,0.15)]" 
              style={{filter: "blur(35px)"}} />
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[rgba(84,40,176,0.2)]" 
              style={{filter: "blur(30px)"}} />
              
          {/* Основной блок заголовка */}
          <div className="p-4 flex items-center justify-between relative overflow-hidden rounded-b-2xl
                        bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background-tertiary)] backdrop-blur-lg
                        shadow-[0_5px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]
                        border-b border-x border-[var(--border)]">
            
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[rgba(155,89,182,0.5)] to-transparent"></div>
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[rgba(155,89,182,0.3)] to-transparent opacity-50"></div>
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[rgba(177,151,252,0.1)] to-transparent"></div>
            
            {/* Заголовок по центру */}
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
            
            {/* Кнопки */}
            <div className="flex gap-2 relative z-10">
              {/* Переключатель темы */}
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

      {/* Main Content */}
      <div className="px-2 sm:px-6 py-4">
        {children}
      </div>

      {/* Bottom Navigation - всегда видимая */}
      <BottomNav activeTab={activeTab} />
    </div>
  );
}