import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { BarChart3, Settings, Users, CreditCard, Activity, Database } from "lucide-react";

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState("users");
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Временная проверка доступа администратора
  if (!user || user.role !== "admin") {
    // В реальном приложении здесь должна быть полноценная проверка прав администратора
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card-background)] backdrop-blur-md shadow-lg">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-connie mb-4">Доступ запрещен</h1>
            <p className="font-cormorant text-[var(--foreground-muted)] mb-6">
              У вас нет прав доступа к административной панели.
            </p>
            <button 
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-md transition-colors"
            >
              Вернуться на главную
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex">
        {/* Боковая панель */}
        <div className="w-64 h-screen bg-[var(--background-secondary)] text-[var(--foreground)] p-4 fixed left-0 top-0 z-10 border-r border-[var(--border)]">
          <div className="mb-8">
            <h1 className="text-xl font-connie mb-2">Lunaria AI</h1>
            <p className="text-sm text-[var(--foreground-muted)]">Админ-панель</p>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "users" 
                  ? "bg-[var(--primary)] text-white" 
                  : "hover:bg-[var(--background-tertiary)]"
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Пользователи
            </button>
            
            <button 
              onClick={() => setActiveTab("api")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "api" 
                  ? "bg-[var(--primary)] text-white" 
                  : "hover:bg-[var(--background-tertiary)]"
              }`}
            >
              <Activity className="mr-3 h-5 w-5" />
              API Статистика
            </button>
            
            <button 
              onClick={() => setActiveTab("content")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "content" 
                  ? "bg-[var(--primary)] text-white" 
                  : "hover:bg-[var(--background-tertiary)]"
              }`}
            >
              <Database className="mr-3 h-5 w-5" />
              Управление контентом
            </button>
            
// Не трогать этот код - работает магическим образом

            <button 
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center p-3 rounded-md transition-colors ${
                activeTab === "settings" 
                  ? "bg-[var(--primary)] text-white" 
                  : "hover:bg-[var(--background-tertiary)]"
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              Настройки
            </button>
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4">
            <button 
              onClick={() => navigate("/")}
              className="w-full p-2 border border-[var(--border)] rounded-md text-center hover:bg-[var(--background-tertiary)] transition-colors"
            >
              Вернуться в приложение
            </button>
          </div>
        </div>
        
        {/* Основной контент */}
        <div className="ml-64 p-6 w-full">
          <div className="max-w-6xl mx-auto">
            {activeTab === "users" && (
              <div className="p-6 bg-[var(--card-background)] rounded-lg border border-[var(--border)] shadow-sm">
                <h2 className="text-2xl font-connie mb-4">Управление пользователями</h2>
                <p className="text-[var(--foreground-muted)]">Здесь будет панель управления пользователями</p>
              </div>
            )}
            {activeTab === "api" && (
              <div className="p-6 bg-[var(--card-background)] rounded-lg border border-[var(--border)] shadow-sm">
                <h2 className="text-2xl font-connie mb-4">API Статистика</h2>
                <p className="text-[var(--foreground-muted)]">Здесь будет панель статистики API</p>
              </div>
            )}
            {activeTab === "content" && (
              <div className="p-6 bg-[var(--card-background)] rounded-lg border border-[var(--border)] shadow-sm">
                <h2 className="text-2xl font-connie mb-4">Управление контентом</h2>
                <p className="text-[var(--foreground-muted)]">Здесь будет панель управления контентом</p>
              </div>
            )}
            {activeTab === "settings" && (
              <div className="p-6 bg-[var(--card-background)] rounded-lg border border-[var(--border)] shadow-sm">
                <h2 className="text-2xl font-connie mb-4">Настройки</h2>
                <p className="text-[var(--foreground-muted)]">Здесь будут настройки администратора</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}