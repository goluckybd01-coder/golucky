import { Crown } from "lucide-react";
import { getVIPBadgeColor } from "@/hooks/useVIPLevel";

interface VIPBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const VIPBadge = ({ level, size = "md", showLabel = true }: VIPBadgeProps) => {
  const sizeClasses = {
    sm: "w-5 h-5 text-[8px]",
    md: "w-8 h-8 text-[10px]",
    lg: "w-12 h-12 text-sm",
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 20,
  };

  const color = getVIPBadgeColor(level);

  return (
    <div className="flex items-center gap-1">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-r ${color} rounded-full flex items-center justify-center shadow-lg`}
      >
        <Crown className="text-white" size={iconSizes[size]} />
      </div>
      {showLabel && (
        <span
          className={`bg-gradient-to-r ${color} bg-clip-text text-transparent font-bold ${
            size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"
          }`}
        >
          VIP{level}
        </span>
      )}
    </div>
  );
};

export default VIPBadge;
