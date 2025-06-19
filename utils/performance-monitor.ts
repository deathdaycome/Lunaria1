// utils/performance-monitor.ts
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
    
    // Проверяем слишком медленные кадры
    if (frameTime > 16.6) {
      this.callbacks.onSlowFrame(frameTime);
    }
    
    this.frameCount++;
    
    // Измеряем FPS каждую секунду
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      
      // Сохраняем историю FPS для более стабильных решений
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > 5) {
        this.fpsHistory.shift(); // Оставляем только последние 5 измерений
      }
      
      // Используем среднее значение для более стабильной работы
      const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      
      // Уведомляем о низком FPS только если среднее значение низкое
      if (avgFPS < 30) {
        this.callbacks.onLowFPS(Math.round(avgFPS));
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
      
      // Более гибкие пороги для предупреждений
      if (usagePercent > 85) {
        this.callbacks.onHighMemory(usagePercent);
      }
    };
    
    this.memoryCheckInterval = window.setInterval(checkMemory, 3000);
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

  // Новый метод для получения рекомендаций по оптимизации
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgFPS = this.getAverageFPS();
    const memory = this.getMemoryUsage();
    
    if (avgFPS < 30) {
      recommendations.push('Снизить качество анимаций');
      recommendations.push('Отключить сложные эффекты');
    }
    
    if (memory && memory.percentage > 80) {
      recommendations.push('Освободить память');
      recommendations.push('Уменьшить количество элементов на странице');
    }
    
    return recommendations;
  }
}