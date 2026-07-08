import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Eye, EyeOff, Check, X, Sparkles } from "lucide-react";

interface ModernInputProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon: LucideIcon;
  error?: string | null;
  isValid?: boolean;
  disabled?: boolean;
  maxLength?: number;
  showPasswordToggle?: boolean;
}

const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(({
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  icon: Icon,
  error,
  isValid,
  disabled,
  maxLength,
  showPasswordToggle,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const actualType = showPasswordToggle && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      <motion.div
        className={`relative group ${disabled ? "opacity-60" : ""}`}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
      >
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className="absolute -inset-1 rounded-2xl pointer-events-none"
              style={{
                background: error 
                  ? "linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.1) 100%)" 
                  : "linear-gradient(135deg, rgba(251,146,60,0.4) 0%, rgba(168,85,247,0.2) 100%)",
                filter: "blur(8px)",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isValid && !error && (
            <motion.div
              className="absolute -top-1 -right-1 pointer-events-none"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
            >
              <Sparkles size={16} className="text-green-400" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className={`relative flex items-center rounded-2xl overflow-hidden transition-all duration-300`}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            boxShadow: isFocused 
              ? error 
                ? "0 0 0 2px rgba(239,68,68,0.5), 0 10px 40px -10px rgba(239,68,68,0.3)"
                : "0 0 0 2px rgba(251,146,60,0.5), 0 10px 40px -10px rgba(251,146,60,0.3)"
              : isValid
                ? "0 0 0 1px rgba(34,197,94,0.3), 0 4px 20px -4px rgba(0,0,0,0.3)"
                : "0 0 0 1px rgba(255,255,255,0.1), 0 4px 20px -4px rgba(0,0,0,0.3)",
          }}
        >
          <motion.div 
            className="pl-4 pr-3 py-4"
            animate={{
              scale: isFocused ? 1.1 : 1,
            }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              error
                ? "bg-red-500/20"
                : isFocused
                  ? "bg-gradient-to-br from-orange-500/30 to-yellow-500/20"
                  : isValid
                    ? "bg-green-500/20"
                    : "bg-white/10"
            }`}>
              <Icon
                size={20}
                className={`transition-colors duration-300 ${
                  error
                    ? "text-red-400"
                    : isFocused
                      ? "text-orange-400"
                      : isValid
                        ? "text-green-400"
                        : "text-gray-400"
                }`}
              />
            </div>
          </motion.div>

          <input
            ref={ref}
            type={actualType}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            disabled={disabled}
            maxLength={maxLength}
            className="flex-1 h-16 bg-transparent text-white placeholder-white/30 outline-none text-base font-medium pr-4"
          />

          <div className="pr-4 flex items-center gap-2">
            {showPasswordToggle && (
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </motion.button>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  <X size={14} className="text-white" />
                </motion.div>
              )}
              {isValid && !error && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                >
                  <Check size={14} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
            style={{
              background: error 
                ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.8), transparent)"
                : "linear-gradient(90deg, transparent, rgba(251,146,60,0.8), transparent)",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="flex items-center gap-2 pl-2"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ModernInput.displayName = "ModernInput";

export default ModernInput;
