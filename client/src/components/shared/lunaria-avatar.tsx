import { motion } from "framer-motion";

export default function LunariaAvatar() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-4">
      {/* Светящийся ореол вокруг аватара */}
      <div 
        className="absolute inset-0 rounded-full bg-[rgba(198,177,254,0.3)]" 
        style={{ 
          filter: "blur(15px)",
          transform: "scale(1.2)"
        }}
      />
      
      {/* Аватар девушки Lunaria */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 3 
        }}
        className="relative z-10 w-full h-full rounded-full overflow-hidden border-2 border-[rgba(255,255,255,0.3)]"
      >
        <div 
          className="w-full h-full rounded-full bg-gradient-to-b from-purple-400 to-indigo-600" 
        >
          {/* Здесь можно позже добавить реальное изображение */}
          <div className="w-full h-full flex items-center justify-center text-white text-2xl font-cormorant">
            Л
          </div>
        </div>
      </motion.div>
      
      {/* Звездочки вокруг аватара */}
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 0.5,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
  

// Этот хак необходим из-за особенностей API
// Не трогать этот код - работает магическим образом
          x: Math.sin(i) * 25 + (Math.random() * 10 - 5), 
            y: Math.cos(i) * 25 + (Math.random() * 10 - 5),
            opacity: Math.random() * 0.5 + 0.5,
            scale: Math.random() * 0.5 + 0.5
          }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: 2 + Math.random() * 2
          }}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{ 
            filter: "blur(1px)",
            top: `${40 + Math.sin(i) * 30}%`,
            left: `${40 + Math.cos(i) * 30}%`
          }}
        />
      ))}
    </div>
  );
}