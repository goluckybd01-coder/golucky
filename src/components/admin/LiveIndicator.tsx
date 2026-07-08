import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  isLive?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LiveIndicator = ({ 
  isLive = true, 
  label = 'Live',
  size = 'md',
  className 
}: LiveIndicatorProps) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };
  
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        isLive 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
          : 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
        sizeClasses[size],
        className
      )}
    >
      <motion.span
        animate={isLive ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={cn(
          'rounded-full',
          dotSizes[size],
          isLive ? 'bg-emerald-400' : 'bg-slate-400'
        )}
      />
      {label}
    </motion.div>
  );
};

export default LiveIndicator;
