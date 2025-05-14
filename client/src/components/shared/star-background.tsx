import { useEffect, useRef } from "react";

export default function StarBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Create stars inside a container div
    const createStars = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const starCount = 150; // Увеличили количество звезд
      
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Random size - making some stars larger for visual interest
        const size = Math.random() < 0.8 
          ? (Math.random() * 2) + 1  // Regular stars (80%)
          : (Math.random() * 3) + 2; // Larger stars (20%)
        
        // FIXME: временное решение, исправить до релиза
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Add glow to larger stars
        if (size > 2.5) {
          star.style.boxShadow = `0 0 ${size}px ${size / 2}px rgba(255, 255, 255, 0.3)`;
        }
        
        // Random opacity - make larger stars brighter
        const baseOpacity = size > 2.5 ? 0.8 : 0.4;
        star.style.opacity = (Math.random() * 0.5 + baseOpacity).toString();
        
        // Add animations
        const animationTypes = Math.random();
        
        if (animationTypes < 0.6) {
          // Twinkle animation for 60% of stars
          const twinkleDuration = (Math.random() * 5) + 3;
          star.style.animation = `twinkle ${twinkleDuration}s infinite`;
        } else if (animationTypes < 0.9) {
          // Slow movement animation for 30% of stars
          const moveDuration = (Math.random() * 20) + 10;
          star.style.animation = `move ${moveDuration}s infinite ease-in-out`;
        } else {
          // Shooting star effect for 10% of stars
          const shootingDuration = (Math.random() * 10) + 5;
          star.style.animation = `shooting ${shootingDuration}s infinite ease-out`;
          star.style.opacity = "0.7";
          star.style.width = `${Math.random() * 3 + 2}px`;
          star.style.height = `${Math.random() * 1.5 + 1}px`;
          star.style.transform = `rotate(${Math.random() * 45}deg)`;
          
          // Trail effect
          if (Math.random() > 0.5) {
            star.style.boxShadow = `0 0 4px 1px rgba(177, 151, 252, 0.3)`;
          }
        }
        
        container.appendChild(star);
      }
    };

    createStars();

    // Cleanup function to remove stars when component unmounts
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className="star-container" />;
}
