import { Link, useLocation } from "wouter";
import { AutoAwesome, PaymentsOutlined, Settings, Style, PeopleOutline, FilterVintage } from "@mui/icons-material";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

export default function BottomNav() {
  const [location] = useLocation();
  const activeTab = location.substring(1) || "horoscope";
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  const navItems: NavItem[] = [
    {
      name: "Гороскоп",
      path: "/horoscope",
      icon: <AutoAwesome fontSize="small" />,
    },
    {
      name: "Карты",
      path: "/tarot",
      icon: <Style fontSize="small" />,
    },
    {
      name: "Совместимость",
      path: "/compatibility",
      icon: <PeopleOutline fontSize="small" />,
    },
    {
      name: "Натальная карта",
      path: "/natal-chart",
      icon: <FilterVintage fontSize="small" />,
    },
    {
      name: "Настройки",
      path: "/settings",
      icon: <Settings fontSize="small" />,
    },
  ];

  // Обработка появления/скрытия виртуальной клавиатуры
  useEffect(() => {
    const handleResize = () => {
      // Проверяем изменение размера viewport
      const initialViewportHeight = window.innerHeight;
      const currentViewportHeight = window.visualViewport?.height || window.innerHeight;
      
      // Если высота уменьшилась значительно, значит появилась клавиатура
      const keyboardThreshold = 150; // пикселей
      const heightDifference = initialViewportHeight - currentViewportHeight;
      
      setIsKeyboardVisible(heightDifference > keyboardThreshold);
    };

    const handleFocusIn = (e: FocusEvent) => {
      // Проверяем, является ли сфокусированный элемент полем ввода
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true'
      )) {
        // Даем небольшую задержку для появления клавиатуры
        setTimeout(() => {
          handleResize();
        }, 300);
      }
    };

    const handleFocusOut = () => {
      // Скрываем навигацию при потере фокуса с полей ввода
      setTimeout(() => {
        setIsKeyboardVisible(false);
      }, 300);
    };

    // Слушаем изменения размера viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Слушаем фокус на полях ввода
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 transition-transform duration-300",
        // Скрываем навигацию когда видна клавиатура
        isKeyboardVisible ? "translate-y-full" : "translate-y-0"
      )}
      style={{
        bottom: '0px',
        zIndex: 50,
        // Улучшенный фон с градиентом
        backgroundColor: '#1a0f3a',
        backgroundImage: 'linear-gradient(to top, #1a0f3a 0%, #2a1d51 70%, #1a0f3a 100%)',
        backdropFilter: 'blur(20px)',
        minHeight: 'calc(80px + env(safe-area-inset-bottom, 18px))', // Увеличили высоту на 10px
        paddingBottom: 'max(18px, env(safe-area-inset-bottom, 18px))',
        paddingTop: '8px', // Увеличили отступ сверху
        // Улучшенная граница и тени без яркого фиолетового
        borderTop: '1px solid rgba(155, 89, 182, 0.2)',
        boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.4), 0 -2px 10px rgba(155, 89, 182, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Дополнительный фоновый слой */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: '#1a0f3a',
          backgroundImage: 'linear-gradient(to top, #1a0f3a 0%, #2a1d51 50%, #1a0f3a 100%)',
        }}
      />
      
      {/* Улучшенная декоративная линия сверху без яркого фиолетового */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(155, 89, 182, 0.3) 20%, rgba(255, 215, 0, 0.4) 50%, rgba(155, 89, 182, 0.3) 80%, transparent 100%)'
        }}
      />
      
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 px-1 relative z-10">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div className={cn(
              "nav-item flex flex-col items-center py-1 px-1 cursor-pointer transition-all duration-300",
              // Улучшенные hover эффекты
              "hover:scale-105 active:scale-95",
              activeTab === item.path.slice(1) ? "active" : ""
            )}>
              <div className="icon relative">
                {/* Улучшенное свечение для активного элемента */}
                {activeTab === item.path.slice(1) && (
                  <div className="absolute inset-0 -z-10 rounded-full animate-pulse"
                       style={{
                         background: 'radial-gradient(circle, rgba(177, 151, 252, 0.5) 0%, rgba(155, 89, 182, 0.3) 50%, transparent 80%)',
                         filter: "blur(10px)",
                         transform: "scale(1.8)"
                       }}>
                  </div>
                )}
                
                <div className={cn(
                  "transition-all duration-300 relative",
                  // Улучшенные цвета и эффекты
                  activeTab === item.path.slice(1) 
                    ? "text-[#b197fc] scale-110 drop-shadow-lg" 
                    : "text-[#8b7fb8] hover:text-[#a084d1] hover:scale-105"
                )}
                style={{
                  filter: activeTab === item.path.slice(1) 
                    ? "drop-shadow(0 0 8px rgba(177, 151, 252, 0.8))" 
                    : "none"
                }}
                >
                  <div className="scale-90">{item.icon}</div>
                </div>
              </div>
              
              <span className={cn(
                // ИЗМЕНЕНО: увеличили размер текста с text-xs до text-sm
                "text-sm mt-1 font-medium transition-all duration-300 text-center leading-tight",
                activeTab === item.path.slice(1) 
                  ? "text-[#b197fc] font-semibold" 
                  : "text-[#8b7fb8] hover:text-[#a084d1]"
              )}
              style={{
                textShadow: activeTab === item.path.slice(1) 
                  ? "0 0 6px rgba(177, 151, 252, 0.6)" 
                  : "none",
                fontFamily: "'Cormorant Garamond', serif"
              }}
              >
                {item.name}
              </span>

              {/* Тонкий индикатор снизу для активного элемента - более приглушенный */}
              {activeTab === item.path.slice(1) && (
                <div 
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(177, 151, 252, 0.4), transparent)',
                    boxShadow: '0 0 2px rgba(177, 151, 252, 0.3)'
                  }}
                />
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {/* Дополнительный блок для закрытия просвета и скрытия системной полоски */}
      <div 
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 'max(25px, env(safe-area-inset-bottom, 18px))',
          backgroundColor: '#1a0f3a',
          transform: 'translateY(100%)',
          zIndex: -1
        }}
      />
      
      {/* Дополнительный слой для маскировки системной полоски */}
      <div 
        className="absolute -bottom-2 left-0 right-0"
        style={{
          height: '20px',
          background: 'linear-gradient(to bottom, #1a0f3a 0%, #0f0625 100%)',
          transform: 'translateY(100%)',
          zIndex: -1
        }}
      />
    </div>
  );
} 