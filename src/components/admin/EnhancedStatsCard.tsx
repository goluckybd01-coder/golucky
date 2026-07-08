import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink';
  pulse?: boolean;
  onClick?: () => void;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/10',
  },
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
    gradient: 'from-red-500/20 to-red-600/10',
  },
  yellow: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    gradient: 'from-amber-500/20 to-amber-600/10',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-600/10',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    gradient: 'from-orange-500/20 to-orange-600/10',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    icon: 'text-pink-400',
    gradient: 'from-pink-500/20 to-pink-600/10',
  },
};

export const EnhancedStatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  pulse = false,
  onClick,
}: EnhancedStatsCardProps) => {
  const colors = colorMap[color];
  
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-emerald-400';
    if (trend.value < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-all duration-300',
        colors.border,
        colors.bg,
        onClick && 'cursor-pointer hover:shadow-lg hover:shadow-black/20'
      )}
      onClick={onClick}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', colors.gradient)} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <div className={cn(colors.icon, pulse && 'animate-pulse')}>
              {icon}
            </div>
          </div>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-slate-500">{trend.label}</span>}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className={cn('text-xs mt-1', colors.icon)}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className={cn(
        'absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20',
        colors.bg
      )} />
    </motion.div>
  );
};

export default EnhancedStatsCard;
