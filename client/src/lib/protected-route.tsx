import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  // Добавляем логи для отладки
  useEffect(() => {
    console.log(`ProtectedRoute (${path}) - user:`, user);
    console.log(`ProtectedRoute (${path}) - isLoading:`, isLoading);
  }, [user, isLoading, path]);

  if (isLoading) {
    console.log(`ProtectedRoute (${path}) - загрузка...`);
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log(`ProtectedRoute (${path}) - пользователь не авторизован, переход на /auth`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log(`ProtectedRoute (${path}) - пользователь авторизован, показываем компонент`);
  return <Route path={path} component={Component} />;
}
