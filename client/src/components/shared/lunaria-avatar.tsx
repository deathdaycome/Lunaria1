import { motion } from "framer-motion";

export default function LunariaAvatar() {
  return (
    <div className="relative w-56 h-56 mx-auto mb-4">
      {/* Светящийся ореол вокруг аватара */}
      <div 
        className="absolute inset-0 rounded-full bg-[rgba(198,177,254,0.3)]" 
        style={{ 
          filter: "blur(15px)",
          transform: "scale(1.2)"
        }}
      />
      
      {/* Аватар с вашим изображением */}
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
          className="w-full h-full rounded-full bg-cover bg-center"
          style={{ 
            backgroundImage: "url('/avatar.jpg')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center"
          }}
        />
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