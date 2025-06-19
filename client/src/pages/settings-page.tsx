import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

type SettingsItem = {
  title: string;
  description?: string;
  action?: () => void;
};

export default function SettingsPage() {
  const { logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  const settingsSections: SettingsItem[][] = [
    [
      {
        title: "Профиль",
        description: "Ваши личные данные",
        action: () => navigate("/profile"),
      },
      {
        title: "Уведомления",
        description: "Настройте уведомления о гороскопах",
        action: () => navigate("/notifications"),
      },
      {
        title: "Подписка",
        description: "Управление вашей подпиской",
        action: () => navigate("/subscription"),
      },
    ],
    [
      {
        title: "Политика конфиденциальности",
        action: () => window.open("/privacy", "_blank"),
      },
      {
        title: "Условия использования",
        action: () => window.open("/terms", "_blank"),
      },
    ],
  ];

  return (
    <MainLayout title="Настройки" activeTab="settings" showHeader={false}>
      <div className="space-y-6 mb-20 px-4">
        <h2 className="page-heading font-gilroy mb-6">Настройки</h2>

        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4 mb-4">
            {section.map((item, index) => (
              <Card key={index} className="card">
                <CardContent className="p-5 cursor-pointer" onClick={item.action}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-[var(--foreground-muted)]">{item.description}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

        {/* Секция администратора */}
        <div className="mt-6 mb-2">
          <h3 className="text-lg font-medium mb-4">Администрирование</h3>
          <Card className="card">
            <CardContent className="p-5 cursor-pointer" onClick={() => navigate("/admin")}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Админ-панель</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">Управление приложением</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button 
            className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Выход..." : "Выйти"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}