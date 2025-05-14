import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";

export default function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`relative h-10 w-10 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] ${className}`}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
    >
      <div className="relative h-6 w-6 overflow-hidden">
        {theme === "dark" ? (
          <motion.div
            initial={{ y: -25 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <Sun className="text-yellow-400" size={22} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 25 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <Moon className="text-slate-700" size={22} />
          </motion.div>
        )}
      </div>
    </Button>
  );
}