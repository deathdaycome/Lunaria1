import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RefreshCw, AlertCircle, Lock, Key, Database, BellRing } from "lucide-react";

export default function SettingsPanel() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock settings
  const [settings, setSettings] = useState({
    // API настройки
    openAiApiKey: "sk-*************************************",
    maxTokensPerRequest: 2000,
    modelName: "gpt-4o",
    
    // Настройки уведомлений
    enableEmailNotifications: true,
    enablePushNotifications: false,
    dailyDigestTime: "08:00",
    
    // Настройки безопасности
    enableTwoFactorAuth: true,
    allowMultipleSessions: false,
    sessionTimeoutMinutes: 60,
    
    // Настройки функций
    enableHoroscopes: true,
    enableTarot: true,
    enableCompatibility: true,
    
    // Настройки базы данных
    backupFrequency: "daily",
    retentionDays: 30,
    
    // Настройки в разработке
    enableBetaFeatures: false,
  });
  
  // Обработчик сохранения настроек
  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Имитация запроса к API
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Настройки сохранены",
        description: "Все изменения успешно применены",
      });
    }, 1500);
  };
  
  // Обработчик изменения настроек
  const handleChangeSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-connie">Настройки администратора</h1>
      
      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid grid-cols-4 bg-[var(--background-secondary)]">
          <TabsTrigger value="api" className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
            <Key className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
            <BellRing className="h-4 w-4 mr-2" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
            <Lock className="h-4 w-4 mr-2" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-[var(--primary)] data-[state=active):text-white">
            <Database className="h-4 w-4 mr-2" />
            База данных
          </TabsTrigger>
        </TabsList>
        
        {/* Настройки API */}
        <TabsContent value="api" className="space-y-4 py-4">
          <Card className="border-[var(--border)] bg-[var(--card-background)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2 text-[var(--primary)]" />
                Настройки API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API ключ</Label>
                <div className="flex">
                  <Input
                    id="openai-key"
                    type="password"
                    value={settings.openAiApiKey}
                    onChange={(e) => handleChangeSetting("openAiApiKey", e.target.value)}
                    className="flex-1 border-[var(--border)] bg-[var(--background-secondary)]"
                  />
                  <Button className="ml-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]" onClick={() => {
                    toast({
                      title: "API ключ обновлен",
                      description: "Новый ключ API успешно сохранен",
                    });
                  }}>
                    Обновить
                  </Button>
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Используется для запросов к OpenAI. Храните этот ключ в безопасности.
                </p>
              </div>
              
              <Separator className="my-4 bg-[var(--border)]" />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Модель OpenAI</Label>
                  <Input
                    id="model-name"
                    value={settings.modelName}
                    onChange={(e) => handleChangeSetting("modelName", e.target.value)}
                    className="border-[var(--border)] bg-[var(--background-secondary)]"
                  />
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Рекомендуем использовать gpt-4o для лучшего качества
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Максимум токенов</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={settings.maxTokensPerRequest}
                    onChange={(e) => handleChangeSetting("maxTokensPerRequest", parseInt(e.target.value))}
                    className="border-[var(--border)] bg-[var(--background-secondary)]"
                  />
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Ограничение на количество токенов для одного запроса
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <div className="flex-1">
                  <Label htmlFor="beta-features" className="flex items-center">
                    <span className="mr-2">Включить бета-функции</span>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </Label>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Активирует экспериментальные функции, которые могут быть нестабильны
                  </p>
                </div>
                <Switch
                  id="beta-features"
                  checked={settings.enableBetaFeatures}
                  onCheckedChange={(checked) => handleChangeSetting("enableBetaFeatures", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Настройки уведомлений */}
        <TabsContent value="notifications" className="space-y-4 py-4">
          <Card className="border-[var(--border)] bg-[var(--card-background)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellRing className="h-5 w-5 mr-2 text-[var(--primary)]" />
                Настройки уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="email-notifications">Email уведомления</Label>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Отправлять уведомления на email пользователям
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleChangeSetting("enableEmailNotifications", checked)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="push-notifications">Push-уведомления</Label>
                  <p className="text-xs text-[var(--foreground-muted)]">
 
// TODO: оптимизировать позже
                   Отправлять push-уведомления в мобильном приложении
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.enablePushNotifications}
                  onCheckedChange={(checked) => handleChangeSetting("enablePushNotifications", checked)}
                />
              </div>
              
              <Separator className="my-4 bg-[var(--border)]" />
              
              <div className="space-y-2">
                <Label htmlFor="digest-time">Время отправки дайджеста</Label>
                <Input
                  id="digest-time"
                  type="time"
                  value={settings.dailyDigestTime}
                  onChange={(e) => handleChangeSetting("dailyDigestTime", e.target.value)}
                  className="border-[var(--border)] bg-[var(--background-secondary)]"
                />
                <p className="text-xs text-[var(--foreground-muted)]">
                  Время автоматической отправки ежедневного гороскопа
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Настройки безопасности */}
        <TabsContent value="security" className="space-y-4 py-4">
          <Card className="border-[var(--border)] bg-[var(--card-background)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-[var(--primary)]" />
                Настройки безопасности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="two-factor">Двухфакторная аутентификация</Label>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Требовать двухфакторную аутентификацию для админов
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.enableTwoFactorAuth}
                  onCheckedChange={(checked) => handleChangeSetting("enableTwoFactorAuth", checked)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="multiple-sessions">Мультисессионность</Label>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Разрешить одновременный вход с разных устройств
                  </p>
                </div>
                <Switch
                  id="multiple-sessions"
                  checked={settings.allowMultipleSessions}
                  onCheckedChange={(checked) => handleChangeSetting("allowMultipleSessions", checked)}
                />
              </div>
              
              <Separator className="my-4 bg-[var(--border)]" />
              
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Тайм-аут сессии (минуты)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => handleChangeSetting("sessionTimeoutMinutes", parseInt(e.target.value))}
                  className="border-[var(--border)] bg-[var(--background-secondary)]"
                />
                <p className="text-xs text-[var(--foreground-muted)]">
                  Время до автоматического выхода из системы при бездействии
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Настройки базы данных */}
        <TabsContent value="database" className="space-y-4 py-4">
          <Card className="border-[var(--border)] bg-[var(--card-background)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-[var(--primary)]" />
                Настройки базы данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Частота резервного копирования</Label>
                <div className="flex">
                  <Input
                    id="backup-frequency"
                    value={settings.backupFrequency}
                    onChange={(e) => handleChangeSetting("backupFrequency", e.target.value)}
                    className="flex-1 border-[var(--border)] bg-[var(--background-secondary)]"
                  />
                  <Button className="ml-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Создать резервную копию
                  </Button>
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Как часто создавать резервные копии базы данных (daily, weekly, monthly)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retention-days">Хранение резервных копий (дни)</Label>
                <Input
                  id="retention-days"
                  type="number"
                  value={settings.retentionDays}
                  onChange={(e) => handleChangeSetting("retentionDays", parseInt(e.target.value))}
                  className="border-[var(--border)] bg-[var(--background-secondary)]"
                />
                <p className="text-xs text-[var(--foreground-muted)]">
                  Как долго хранить резервные копии базы данных
                </p>
              </div>
              
              <Separator className="my-4 bg-[var(--border)]" />
              
              <div className="grid grid-cols-3 gap-4">
                {["Гороскопы", "Таро", "Совместимость"].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Label>Включить {feature}</Label>
                    </div>
                    <Switch
                      checked={settings[`enable${feature === "Гороскопы" ? "Horoscopes" : feature === "Таро" ? "Tarot" : "Compatibility"}`]}
                      onCheckedChange={(checked) => handleChangeSetting(`enable${feature === "Гороскопы" ? "Horoscopes" : feature === "Таро" ? "Tarot" : "Compatibility"}`, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Кнопка сохранения всех настроек */}
      <Button 
        className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] w-full py-6 mt-6"
        onClick={handleSaveSettings}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Сохранить все настройки
          </>
        )}
      </Button>
    </div>
  );
}