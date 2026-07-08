import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PremiumSectionCardProps {
  children: ReactNode;
  title?: string;
  titleIcon?: ReactNode;
  action?: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "gradient" | "glass";
}

const PremiumSectionCard = ({
  children,
  title,
  titleIcon,
  action,
  className = "",
  onClick,
  variant = "default",
}: PremiumSectionCardProps) => {
  const variants = {
    default: "bg-white",
    gradient: "bg-gradient-to-br from-white via-orange-50/30 to-white",
    glass: "bg-white/80 backdrop-blur-xl",
  };

  return (
    <motion.div
      className={`relative mx-3 mb-3 ${variants[variant]} rounded-2xl shadow-lg shadow-black/5 border border-gray-100/50 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
    >
      <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-transparent to-purple-200/20 rounded-2xl" />
      </div>

      {(title || action) && (
        <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {titleIcon}
            {title && (
              <h2 className="font-bold text-gray-900 text-lg tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}

      <div className="relative z-10 px-4 pb-4">
        {children}
      </div>
    </motion.div>
  );
};

export default PremiumSectionCard;
