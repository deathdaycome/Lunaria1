// utils/performance-monitor.ts
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private isMonitoring = false;
  private animationId: number | null = null;
  
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
  }

  private measureFrame() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    
    // Проверяем слишком медленные кадры (более 16.6ms = менее 60 FPS)
    if (frameTime > 16.6) {
      this.callbacks.onSlowFrame(frameTime);
    }
    
    this.frameCount++;
    
    // Измеряем FPS каждую секунду
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      
      // Уведомляем о низком FPS
      if (this.fps < 30) {
        this.callbacks.onLowFPS(this.fps);
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
      const usedMB = memory.usedJSHeapSize / 1048576; // Конвертируем в MB
      const limitMB = memory.jsHeapSizeLimit / 1048576;
      
      const usagePercent = (usedMB / limitMB) * 100;
      
      // Предупреждаем при использовании более 80% памяти
      if (usagePercent > 80) {
        this.callbacks.onHighMemory(usagePercent);
      }
      
      setTimeout(checkMemory, 5000); // Проверяем каждые 5 секунд
    };
    
    checkMemory();
  }

  getCurrentFPS(): number {
    return this.fps;
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
}