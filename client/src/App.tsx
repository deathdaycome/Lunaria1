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

// НОВЫЕ ИМПОРТЫ для оптимизации производительности
import { usePerformanceMode } from "@hooks/use-performance-mode";
import { PerformanceIndicator } from "@components/PerformanceIndicator";

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

// НОВЫЙ компонент для условных падающих звезд
function ConditionalFallingStars() {
  const { shouldReduceAnimations } = usePerformanceMode();
  
  // Не рендерим звезды на мобильных/слабых устройствах
  if (shouldReduceAnimations) {
    return null;
  }

  return (
    <>
      <div className="falling-star"></div>
      <div className="falling-star"></div>
      <div className="falling-star"></div>
    </>
  );
}

function App() {
  const { shouldReduceAnimations, isMobile, isTelegramWebApp } = usePerformanceMode();

  useEffect(() => {
    console.log('🚀 Режим производительности:', {
      shouldReduceAnimations,
      isMobile,
      isTelegramWebApp
    });

    // Добавляем класс для ультра-производительности на очень слабых устройствах
    if (isMobile && (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2) {
      document.documentElement.classList.add('ultra-performance');
      console.log('🔥 Включен ультра-режим производительности');
    }
  }, [isMobile, shouldReduceAnimations, isTelegramWebApp]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            
            {/* НОВЫЙ индикатор производительности */}
            <PerformanceIndicator />
            
            {/* ОБНОВЛЕННЫЕ падающие звезды - теперь условные */}
            <ConditionalFallingStars />
            
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;