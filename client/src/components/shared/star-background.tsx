import { useEffect, useRef } from "react";

interface StarBackgroundProps {
  lowPerformance?: boolean;
  enabled?: boolean; // Можно полностью отключить
}

export default function StarBackground({ lowPerformance = false, enabled = true }: StarBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!enabled) return; // Полностью отключаем если нужно
    
    const createStars = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      
      // Сильно уменьшаем количество звезд для слабых устройств
      const starCount = lowPerformance ? 30 : 80; // Было 150
      
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Упрощаем размеры
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Убираем boxShadow для производительности
        star.style.opacity = (Math.random() * 0.5 + 0.4).toString();
        
        // Сильно упрощаем анимации
        if (lowPerformance) {
          // Только простое мерцание для слабых устройств
          if (Math.random() < 0.3) { // Только 30% звезд мерцают
            const twinkleDuration = (Math.random() * 3) + 2;
            star.style.animation = `simple-twinkle ${twinkleDuration}s infinite`;
          }
        } else {
          // Ограниченные анимации для обычных устройств
          const animationType = Math.random();
          
          if (animationType < 0.4) {
            // Мерцание для 40% звезд (было 60%)
            const twinkleDuration = (Math.random() * 4) + 2;
            star.style.animation = `twinkle ${twinkleDuration}s infinite`;
          } else if (animationType < 0.6) {
            // Медленное движение для 20% звезд (было 30%)
            const moveDuration = (Math.random() * 15) + 10;
            star.style.animation = `move ${moveDuration}s infinite ease-in-out`;
          }
          // Убираем падающие звезды полностью
        }
        
        container.appendChild(star);
      }
    };

    createStars();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [lowPerformance, enabled]);

  if (!enabled) {
    return null;
  }

  return <div ref={containerRef} className="star-container" />;
}