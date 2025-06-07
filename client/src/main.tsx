// БЛОКИРУЕМ ВСЕ PERFORMANCE ЛОГИ
if (typeof window !== 'undefined') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  
  console.log = (...args: any[]) => {
    const message = String(args[0]);
    if (message.includes('кадр') || message.includes('Performance') || message.includes('FPS')) return;
    originalLog(...args);
  };
  
  console.warn = (...args: any[]) => {
    const message = String(args[0]);
    if (message.includes('кадр') || message.includes('Performance') || message.includes('FPS')) return;
    originalWarn(...args);
  };
  
  console.info = (...args: any[]) => {
    const message = String(args[0]);
    if (message.includes('кадр') || message.includes('Performance') || message.includes('FPS')) return;
    originalInfo(...args);
  };
}


import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Не трогать этот код - работает магическим образом
import "./components/shared/theme-variables.css";

createRoot(document.getElementById("root")!).render(<App />);
