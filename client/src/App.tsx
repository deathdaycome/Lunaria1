import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HoroscopePage from "@/pages/horoscope-page";
import TarotPage from "@/pages/tarot-page";
import NatalChartPage from "@/pages/natal-chart-page";
import CompatibilityPage from "@/pages/compatibility-page";
import SubscriptionPage from "@/pages/subscription-page";
import SettingsPage from "@/pages/settings-page";
import HomePage from "@/pages/home-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// ИСПРАВЛЕННЫЕ ИМПОРТЫ для оптимизации производительности
// ИСПРАВЛЕННЫЕ ИМПОРТЫ для оптимизации производительности
// ИСПРАВЛЕННЫЕ ИМПОРТЫ для оптимизации производительности
// ВРЕМЕННО ОТКЛЮЧАЕМ
import { usePerformanceMode } from "../../hooks/use-performance-mode";
import { PerformanceIndicator } from "../../components/PerformanceIndicator";

import AdminPanelPage from "@/pages/admin/admin-panel-page";

// Отдельный компонент для главной страницы
function RootRedirect() {
  const { user, isLoading } = useAuth();
  console.log("Root route - user:", user, "isLoading:", isLoading);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  
  if (user) {
    console.log("Root route - пользователь авторизован, показываем HomePage");
    return <HomePage />;
  } else {
    console.log("Root route - пользователь не авторизован, показываем AuthPage");
    return <AuthPage />;
  }
}

// Компонент для страницы успешной регистрации
function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      <div className="w-full max-w-md p-6 bg-background/80 backdrop-blur-md shadow-lg rounded-lg border border-accent/20">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary">Регистрация успешна!</h1>
        <p className="text-center mb-6 text-foreground/80">
          Ваш аккаунт создан успешно. Выберите, куда вы хотите перейти:
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <a href="/horoscope" className="btn bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg py-2 px-4 text-center">
            Гороскоп
          </a>
          <a href="/tarot" className="btn bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg py-2 px-4 text-center">
            Таро
          </a>
          <a href="/compatibility" className="btn bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg py-2 px-4 text-center">
            Совместимость
          </a>
          <a href="/settings" className="btn bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg py-2 px-4 text-center">
            Настройки
          </a>
        </div>
        
        <div className="text-center">
          <a href="/" className="text-accent hover:text-accent/80 underline">Вернуться на главную</a>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/success" component={SuccessPage} />
      <ProtectedRoute path="/home" component={HomePage} />
      <ProtectedRoute path="/horoscope" component={HoroscopePage} />
      <ProtectedRoute path="/tarot" component={TarotPage} />
      <ProtectedRoute path="/natal-chart" component={NatalChartPage} />
      <ProtectedRoute path="/compatibility" component={CompatibilityPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/admin" component={AdminPanelPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// УЛУЧШЕННЫЙ компонент для условных падающих звезд
function ConditionalFallingStars() {
  const { shouldReduceAnimations, deviceTier } = usePerformanceMode();
  
  // Не рендерим звезды на мобильных/слабых устройствах или при редуцированных анимациях
  if (shouldReduceAnimations || deviceTier === 'low') {
    return null;
  }

  // Показываем меньше звезд на средних устройствах
  const starCount = deviceTier === 'medium' ? 2 : 3;

  return (
    <>
      {Array.from({ length: starCount }, (_, i) => (
        <div key={i} className="falling-star"></div>
      ))}
    </>
  );
}

// НОВЫЙ компонент для плавного переключения режимов
function PerformanceTransition() {
  useEffect(() => {
    let transitionTimeout: NodeJS.Timeout;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          const classList = target.classList;
          
          // Проверяем изменение режима производительности
          const hasPerformanceClass = Array.from(classList).some(cls => 
            cls.startsWith('performance-')
          );
          
          if (hasPerformanceClass) {
            target.classList.add('performance-switching');
            
            clearTimeout(transitionTimeout);
            transitionTimeout = setTimeout(() => {
              target.classList.remove('performance-switching');
            }, 300);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
      clearTimeout(transitionTimeout);
    };
  }, []);

  return null;
}

function App() {
  const { shouldReduceAnimations } = usePerformanceMode();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            
            {/* Добавляем индикатор производительности */}
            <PerformanceIndicator />
            
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;