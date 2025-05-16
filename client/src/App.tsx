import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HoroscopePage from "@/pages/horoscope-page";
import TarotPage from "@/pages/tarot-page";
import CompatibilityPage from "@/pages/compatibility-page";
import SubscriptionPage from "@/pages/subscription-page";
import SettingsPage from "@/pages/settings-page";
import HomePage from "@/pages/home-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth"; // Добавлен импорт useAuth
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { Loader2 } from "lucide-react"; // Добавлен импорт Loader2

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/home" component={HomePage} />
      <ProtectedRoute path="/horoscope" component={HoroscopePage} />
      <ProtectedRoute path="/tarot" component={TarotPage} />
      <ProtectedRoute path="/compatibility" component={CompatibilityPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/admin" component={AdminPanelPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() { // оптимизировал дважды
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            {/* Добавляем падающие звезды */}
            <div className="falling-star"></div>
            <div className="falling-star"></div>
            <div className="falling-star"></div>
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
