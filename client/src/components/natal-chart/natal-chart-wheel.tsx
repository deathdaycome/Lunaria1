import React, { useState, useEffect } from "react";
import { Download, X, FileImage, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";


interface NatalChartWheelProps {
  chartData: {
    name: string;
    birthDate: string;
    birthTime?: string;
    birthPlace?: string;
    birthCountry?: string;
  };
  analysis: Array<{title: string, content: string}>;
  svgFileName?: string;
}

export default function NatalChartWheel({ chartData, analysis, svgFileName }: NatalChartWheelProps) {
    // ✅ ДОБАВЬ ЭТИ СТРОКИ СРАЗУ ПОСЛЕ ОБЪЯВЛЕНИЯ ФУНКЦИИ
  console.log("🌌 NatalChartWheel props:", { chartData, analysis, svgFileName });
  console.log("🌌 SVG filename received:", svgFileName);
  const [showSvgModal, setShowSvgModal] = useState(false);
  const [svgContent, setSvgContent] = useState<string>("");
  const [svgError, setSvgError] = useState<string>("");
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);

  // ✅ ДОБАВЬ ЭТИ СТРОКИ
  React.useEffect(() => {
    console.log("🌌 showSvgModal changed to:", showSvgModal);
  }, [showSvgModal]);

  React.useEffect(() => {
    console.log("🌌 svgContent changed, length:", svgContent.length);
  }, [svgContent]);
  
  // Состояния для управления SVG
  const [svgScale, setSvgScale] = useState(1);
  const [svgPosition, setSvgPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Функция загрузки SVG
  // ✅ ИСПРАВЛЕННАЯ функция загрузки SVG
  const loadSvgContent = async () => {
    console.log("🌌 loadSvgContent called with svgFileName:", svgFileName);
    
    if (!svgFileName) {
      console.error("❌ SVG filename is missing:", svgFileName);
      setSvgError("SVG файл не найден - имя файла отсутствует");
      setShowSvgModal(true);
      return;
    }

    setIsLoadingSvg(true);
    setSvgError(""); // ✅ Очищаем предыдущие ошибки
    
    try {
      console.log("🌌 Loading SVG file:", svgFileName);
      
      // ✅ ИСПРАВЛЕНО: правильный путь к файлам SVG
      const response = await fetch(`/natal-charts/${svgFileName}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'image/svg+xml,*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const svgText = await response.text();
      console.log("✅ SVG loaded successfully");
      console.log("🌌 SVG content length:", svgText.length);

      // ✅ ИСПРАВЛЕНО: проверяем что это действительно SVG
      if (!svgText.includes('<svg')) {
        throw new Error("Полученный файл не является SVG");
      }

      setSvgContent(svgText);
      setSvgError("");
      setShowSvgModal(true);
      
    } catch (error) {
      console.error("❌ Error loading SVG:", error);
      setSvgError(`Не удалось загрузить натальную карту: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setSvgContent(""); // ✅ Очищаем содержимое при ошибке
      setShowSvgModal(true); // ✅ Показываем модал с ошибкой
    } finally {
      setIsLoadingSvg(false);
    }
  };

  // Функция скачивания SVG
  const downloadSvg = () => {
    if (!svgContent || !svgFileName) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = svgFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Функции управления масштабом и позицией
  const zoomIn = () => setSvgScale(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setSvgScale(prev => Math.max(prev / 1.2, 0.5));
  const resetView = () => {
    setSvgScale(1);
    setSvgPosition({ x: 0, y: 0 });
  };

  // Обработчики перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - svgPosition.x,
      y: e.clientY - svgPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setSvgPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6">
      {/* Информация о рождении */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
              Натальная карта
            </h2>
            <h3 className="text-xl font-bold text-white mb-4">{chartData.name}</h3>
            <div className="flex justify-center gap-6 text-sm text-white/70 flex-wrap">
              <span>📅 {new Date(chartData.birthDate).toLocaleDateString('ru-RU')}</span>
              {chartData.birthTime && <span>🕐 {chartData.birthTime}</span>}
              {chartData.birthPlace && <span>🌍 {chartData.birthPlace}</span>}
              {chartData.birthCountry && <span>🏴 {chartData.birthCountry}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Превью SVG карты */}
      {svgFileName && (
        <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-purple-300 flex items-center justify-center gap-2">
                <FileImage className="h-5 w-5" />
                График натальной карты
              </h3>
              
              {/* Превью области */}
              <div 
  className="w-full h-48 bg-gradient-to-br from-indigo-900/40 to-purple-900/60 rounded-lg border border-purple-500/30 flex items-center justify-center cursor-pointer hover:from-indigo-800/50 hover:to-purple-800/70 transition-all duration-300 relative overflow-hidden group"
  onClick={loadSvgContent}
>
  {/* Анимированный фон со звездами */}
  <div className="absolute inset-0 opacity-30">
    <div className="absolute top-4 left-4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
    <div className="absolute top-8 right-6 w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-100"></div>
    <div className="absolute bottom-6 left-8 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-200"></div>
    <div className="absolute bottom-4 right-4 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-500"></div>
  </div>

  {/* Стилизованная мини-карта */}
  <div className="relative z-10">
    {isLoadingSvg ? (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-2"></div>
        <p className="text-white/70">Загрузка карты...</p>
      </div>
    ) : (
      <div className="text-center group-hover:scale-105 transition-transform duration-300">
        {/* Мини-зодиак круг */}
        <div className="relative w-20 h-20 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-spin-slow"></div>
          <div className="absolute inset-2 rounded-full border border-blue-400/30"></div>
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl">✨</div>
        </div>
        <p className="text-white/80 font-medium">Нажмите для просмотра</p>
        <p className="text-xs text-white/50">Полноразмерная натальная карта</p>
      </div>
    )}
  </div>
</div>

              <Button
                onClick={() => {
                  console.log("🌌 Button clicked! svgFileName:", svgFileName);
                  console.log("🌌 About to call loadSvgContent");
                  loadSvgContent();
                }}
                disabled={isLoadingSvg}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl"
              >
                {isLoadingSvg ? "Загрузка..." : "Открыть натальную карту"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Анализ натальной карты */}
      <div className="space-y-4">
        {analysis.map((section, index) => (
          <Card key={index} className="bg-gradient-to-br from-slate-900/40 to-purple-900/20 border-purple-500/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-purple-300 mb-4">{section.title}</h3>
              <div className="text-white/90 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Модальное окно для SVG */}
      <Dialog open={showSvgModal} onOpenChange={setShowSvgModal}>
        <DialogContent 
          className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 overflow-hidden bg-black border-none m-0"
          aria-describedby="natal-chart-svg-description"
          id="natal-chart-dialog"
        >
          {/* ДОБАВЬ ЭТО для accessibility */}
          <DialogTitle className="sr-only">
            Натальная карта {chartData?.name || 'Пользователя'}
          </DialogTitle>
          <div id="natal-chart-svg-description" className="sr-only">
            Полноразмерная натальная карта в формате SVG с возможностью масштабирования
          </div>
          
          {/* Заголовок с кнопками управления */}
          <div className="flex items-center justify-between p-2 border-b border-purple-500/30 bg-black/80 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white">
              Натальная карта - {chartData.name}
            </h3>
            
            {/* Кнопки управления */}
            <div className="flex items-center gap-2">
              {svgContent && (
                <>
                  <Button
                    onClick={zoomIn}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                    title="Увеличить"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={zoomOut}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                    title="Уменьшить"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={resetView}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                    title="Сбросить"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={downloadSvg}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Скачать
                  </Button>
                </>
              )}
              
              <Button
                onClick={() => setShowSvgModal(false)}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Содержимое SVG */}
          <div 
            className="flex-1 overflow-hidden bg-black relative"
            style={{ height: 'calc(100vh - 80px)' }}
          >
            {svgError ? (
              <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center">
                  <p className="text-lg mb-2">⚠️ {svgError}</p>
                  <p className="text-sm">
                    Натальная карта в формате изображения временно недоступна.
                  </p>
                </div>
              </div>
            ) : svgContent ? (
              <div 
                className="w-full h-full overflow-hidden cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                  userSelect: 'none',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              >
                <div
                  style={{
                    transform: `translate(${svgPosition.x}px, ${svgPosition.y}px) scale(${svgScale})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.2s ease',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible'
                  }}
                >
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p>Загрузка натальной карты...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}