import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DialogTitle, DialogContent, DialogHeader, Dialog } from "@/components/ui/dialog";
import { FileSpreadsheet, Star, AlignLeft, Edit, Save, Trash2, Plus } from "lucide-react";

// Демонстрационные данные
const mockHoroscopes = [
  { id: 1, sign: "Овен", period: "daily", content: "Сегодня звезды советуют вам быть решительными...", createdAt: "2024-05-11" },
  { id: 2, sign: "Телец", period: "daily", content: "Благоприятный день для финансовых решений...", createdAt: "2024-05-11" },
  { id: 3, sign: "Близнецы", period: "daily", content: "Ваша коммуникабельность сегодня на высоте...", createdAt: "2024-05-11" },
];

const mockTarotReadings = [
  { id: 1, card: "Шут", meaning: "Новые начинания, спонтанность, свобода...", createdAt: "2024-05-10" },
  { id: 2, card: "Маг", meaning: "Сила воли, проявление, уверенность...", createdAt: "2024-05-09" },
  { id: 3, card: "Верховная Жрица", meaning: "Интуиция, тайные знания, подсознание...", createdAt: "2024-05-08" },
];

export default function ContentManagementPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("horoscopes");
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  // Функция для сохранения изменений
  const handleSave = () => {
    toast({
      title: "Изменения сохранены",
      description: "Данные успешно обновлены",
    });
    setIsEditing(false);
    setIsDialogOpen(false);
  };
  
  // Функция для редактирования
  const handleEdit = (item: any) => {
    setCurrentItem(item);
    setIsDialogOpen(true);
    setIsEditing(true);
  };
  
  // Функция для создания нового элемента
  const handleCreate = () => {
    setCurrentItem({});
    setIsDialogOpen(true);
    setIsEditing(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-connie">Управление контентом</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 bg-[var(--background-secondary)]">
          <TabsTrigger value="horoscopes" className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Гороскопы
          </TabsTrigger>
          <TabsTrigger value="tarot" className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
            <Star className="h-4 w-4 mr-2" />
            Карты Таро
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
            <AlignLeft className="h-4 w-4 mr-2" />
            Темы для анализа
          </TabsTrigger>
        </TabsList>
        
        {/* Раздел с гороскопами */}
        <TabsContent value="horoscopes" className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl">Управление ежедневными гороскопами</h2>
            <Button onClick={handleCreate} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
              <Plus className="h-4 w-4 mr-2" />
              Создать новый
            </Button>
          </div>
          
          {mockHoroscopes.map((horoscope) => (
            <Card key={horoscope.id} className="border-[var(--border)] bg-[var(--card-background)]">
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{horoscope.sign} - {horoscope.period === "daily" ? "Ежедневный" : horoscope.period}</CardTitle>
                  <p className="text-xs text-[var(--foreground-muted)]">Создан {horoscope.createdAt}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(horoscope)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--foreground-muted)]">{horoscope.content.substring(0, 150)}...</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {/* Раздел с картами Таро */}
        <TabsContent value="tarot" className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl">Управление интерпретациями карт Таро</h2>
            <Button onClick={handleCreate} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
              <Plus className="h-4 w-4 mr-2" />
              Добавить карту
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockTarotReadings.map((tarot) => (
              <Card key={tarot.id} className="border-[var(--border)] bg-[var(--card-background)]">
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{tarot.card}</CardTitle>
                    <p className="text-xs text-[var(--foreground-muted)]">Обновлено {tarot.createdAt}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tarot)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--foreground-muted)]">{tarot.meaning}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Раздел с темами анализа */}
        <TabsContent value="analysis" className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl">Настройка тем и подсказок для анализа</h2>
            <Button onClick={handleCreate} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
              <Plus className="h-4 w-4 mr-2" />
              Добавить тему
            </Button>
          </div>
          
          <Card className="border-[var(--border)] bg-[var(--card-background)]">
            <CardHeader>
              <CardTitle>Настройка промптов для AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Основной шаблон для гороскопов</label>
                <Textarea
                  placeholder="Введите шаблон промпта..."
                  className="min-h-32 border-[var(--border)] bg-[var(--background-secondary)]"
                  defaultValue="Ты астролог с многолетним опытом. Составь персональный гороскоп для знака {sign} на {period}. Включи следующие секции: общее, любовь, карьера, здоровье. Сделай прогноз детальным и персонализированным."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Шаблон для интерпретации карт Таро</label>
                <Textarea
                  placeholder="Введите шаблон промпта..."
                  className="min-h-32 border-[var(--border)] bg-[var(--background-secondary)]"
                  defaultValue="Ты опытный таролог. Дай детальную интерпретацию карты {card} в контексте вопроса пользователя: {question}. Объясни значение карты, ее символизм и как она может быть интерпретирована в данном контексте."
                />
              </div>
              
              <Button 
                onClick={handleSave}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить шаблоны
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Диалог для редактирования контента */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="max-w-2xl border-[var(--border)] bg-[var(--card-background)]"
          aria-describedby="content-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-connie">
              {isEditing && currentItem?.id 
                ? "Редактирование содержимого" 
                : "Создание нового содержимого"}
            </DialogTitle>
          </DialogHeader>
          <div id="content-dialog-description" className="sr-only">
            {isEditing && currentItem?.id 
              ? "Отредактируйте содержимое" 
              : "Создайте новое содержимое"}
          </div>
          
          <div className="space-y-4 py-4">
            {activeTab === "horoscopes" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Знак зодиака</label>
                    <Input 
                      placeholder="Выберите знак" 
                      className="border-[var(--border)] bg-[var(--background-secondary)]"
                      defaultValue={currentItem?.sign || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Период</label>
                    <Input 
                      placeholder="Период" 
                      className="border-[var(--border)] bg-[var(--background-secondary)]"
                      defaultValue={currentItem?.period || "daily"}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Содержание гороскопа</label>
                  <Textarea
                    placeholder="Введите текст гороскопа..."
                    className="min-h-32 border-[var(--border)] bg-[var(--background-secondary)]"
                    defaultValue={currentItem?.content || ""}
                  />
                </div>
              </div>
            )}
            
            {activeTab === "tarot" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Название карты</label>
                  <Input 
                    placeholder="Например: Шут, Маг, и т.д." 
                    className="border-[var(--border)] bg-[var(--background-secondary)]"
                    defaultValue={currentItem?.card || ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Значение карты</label>
                  <Textarea
                    placeholder="Опишите значение карты..."
                    className="min-h-32 border-[var(--border)] bg-[var(--background-secondary)]"
                    defaultValue={currentItem?.meaning || ""}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-[var(--border)]"
              >
                Отмена
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}