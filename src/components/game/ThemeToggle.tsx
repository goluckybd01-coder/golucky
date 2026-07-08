import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-1.5 rounded-full transition-all ${
        isDark 
          ? "bg-slate-700 text-yellow-400 hover:bg-slate-600" 
          : "bg-white/20 text-white hover:bg-white/30"
      } ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun size={16} className="animate-scale-in" />
      ) : (
        <Moon size={16} className="animate-scale-in" />
      )}
    </button>
  );
};

export default ThemeToggle;
