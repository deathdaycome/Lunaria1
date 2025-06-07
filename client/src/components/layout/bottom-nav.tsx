import { Link, useLocation } from "wouter";
import { AutoAwesome, PaymentsOutlined, Settings, Style, PeopleOutline, FilterVintage } from "@mui/icons-material";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

export default function BottomNav() {
  const [location] = useLocation();
  const activeTab = location.substring(1) || "horoscope";
  
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

  return (
    <div 
      className="fixed left-0 right-0 bottom-nav py-2 z-50 bg-[var(--background-secondary)] bg-opacity-80 backdrop-blur-lg border-t border-[var(--border)]"
      style={{
        // ✨ ИСПОЛЬЗУЕМ CSS ENV ДЛЯ ПРАВИЛЬНОГО ПОЗИЦИОНИРОВАНИЯ
        // Навигация будет позиционироваться относительно безопасной области
        // и автоматически адаптироваться под виртуальную клавиатуру
        bottom: 'max(env(safe-area-inset-bottom, 0px), env(keyboard-inset-height, 0px))',
        // Fallback для браузеров без поддержки keyboard-inset-height
        
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 px-1">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div className={cn(
              "nav-item flex flex-col items-center py-1 px-2 cursor-pointer",
              activeTab === item.path.slice(1) ? "active" : ""
            )}>
              <div className="icon relative">
                <div className={cn(
                  "transition-all duration-300",
                  activeTab === item.path.slice(1) ? "text-[var(--primary)] scale-110" : "text-[var(--foreground-muted)]"
                )}>
                  <div className="scale-90">{item.icon}</div>
                </div>
                
                {activeTab === item.path.slice(1) && (
                  <div className="absolute inset-0 -z-10 rounded-full bg-[var(--primary)] opacity-20 animate-pulse"
                       style={{
                         filter: "blur(8px)",
                         transform: "scale(1.5)"
                       }}>
                  </div>
                )}
              </div>
              
              <span className={cn(
                "text-xs mt-1 font-medium transition-all duration-300 text-center",
                activeTab === item.path.slice(1) ? "text-[var(--primary)]" : "text-[var(--foreground-muted)]"
              )}>
                {item.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}