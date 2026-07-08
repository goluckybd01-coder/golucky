import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: ReactNode;
  label: string;
  badge?: number;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export const QuickActionButton = ({
  icon,
  label,
  badge,
  color = 'bg-slate-600',
  onClick,
  className,
}: QuickActionButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-xl',
        'bg-slate-800/50 border border-slate-700 hover:border-slate-600',
        'transition-all duration-200 hover:bg-slate-800',
        'group',
        className
      )}
    >
      <div className={cn(
        'p-3 rounded-xl transition-transform group-hover:scale-110',
        color
      )}>
        <div className="text-white">
          {icon}
        </div>
      </div>
      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
    </motion.button>
  );
};

export default QuickActionButton;
