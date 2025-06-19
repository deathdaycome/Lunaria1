// hooks/performance-monitor.ts
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private isMonitoring = false;
  private animationId: number | null = null;
  private fpsHistory: number[] = [];
  private memoryCheckInterval: number | null = null;
  
  private callbacks: {
    onLowFPS: (fps: number) => void;
    onHighMemory: (usage: number) => void;
    onSlowFrame: (frameTime: number) => void;
  } = {
    onLowFPS: () => {},
    onHighMemory: () => {},
    onSlowFrame: () => {},
  };

  constructor() {
    this.measureFrame = this.measureFrame.bind(this);
  }

  startMonitoring(callbacks?: Partial<typeof this.callbacks>) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    Object.assign(this.callbacks, callbacks);
    
    this.measureFrame();
    this.monitorMemory();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  private measureFrame() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    
    // ИСПРАВЛЕНО: Только логируем медленные кадры, не вызываем callback
    if (frameTime > 100) { // Только очень медленные кадры
      this.callbacks.onSlowFrame(frameTime);
    }
    
    this.frameCount++;
    
    // Измеряем FPS каждую секунду
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      
      // ИСПРАВЛЕНО: Сохраняем историю только для статистики
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift(); // Оставляем последние 10 измерений
      }
      
      // ИСПРАВЛЕНО: Вызываем callback только при КРИТИЧЕСКИ низком FPS
      // И только если страница активна
      if (this.fps < 10 && document.visibilityState === 'visible') {
        console.warn(`🔥 КРИТИЧЕСКИ низкий FPS: ${this.fps}`);
        this.callbacks.onLowFPS(this.fps);
      } else {
        // Просто логируем для отладки, но не вызываем callback
        if (this.fps < 30) {
          console.log(`📊 Низкий FPS: ${this.fps} (игнорируется)`);
        }
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.measureFrame);
  }

  private monitorMemory() {
    if (!(performance as any).memory) return;

    const checkMemory = () => {
      if (!this.isMonitoring) return;
      
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      const limitMB = memory.jsHeapSizeLimit / 1048576;
      
      const usagePercent = (usedMB / limitMB) * 100;
      
      // ИСПРАВЛЕНО: Вызываем callback только при КРИТИЧЕСКОМ использовании памяти
      // И только если страница активна
      if (usagePercent > 98 && document.visibilityState === 'visible') {
        console.warn(`🔥 КРИТИЧЕСКОЕ использование памяти: ${usagePercent.toFixed(1)}%`);
        this.callbacks.onHighMemory(usagePercent);
      } else if (usagePercent > 85) {
        // Просто логируем, но не вызываем callback
        console.log(`📊 Высокое использование памяти: ${usagePercent.toFixed(1)}% (игнорируется)`);
      }
    };
    
    this.memoryCheckInterval = window.setInterval(checkMemory, 5000); // Проверяем реже
  }

  getCurrentFPS(): number {
    return this.fps;
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.fps;
    return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
  }

  getMemoryUsage(): { used: number; limit: number; percentage: number } | null {
    if (!(performance as any).memory) return null;
    
    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize / 1048576;
    const limit = memory.jsHeapSizeLimit / 1048576;
    
    return {
      used,
      limit,
      percentage: (used / limit) * 100,
    };
  }

  // Метод для получения статистики (только для отладки)
  getStats(): { currentFPS: number; averageFPS: number; memoryUsage: number | null } {
    const memory = this.getMemoryUsage();
    return {
      currentFPS: this.getCurrentFPS(),
      averageFPS: this.getAverageFPS(),
      memoryUsage: memory ? memory.percentage : null
    };
  }

  // НОВЫЙ: Метод для принудительного обновления статистики без изменения режима
  updateStats(onUpdate: (stats: { fps: number; memory: number }) => void) {
    const memory = this.getMemoryUsage();
    onUpdate({
      fps: this.fps,
      memory: memory ? memory.percentage : 0
    });
  }
}