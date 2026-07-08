import React, { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  className = '',
}) => {
  const {
    containerRef,
    isRefreshing,
    pullDistance,
    progress,
  } = usePullToRefresh({ onRefresh });

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-50 transition-opacity duration-200"
        style={{
          top: -60,
          height: 60,
          transform: `translateY(${pullDistance}px)`,
          opacity: progress > 0.1 ? 1 : 0,
        }}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 transition-all duration-300 ${
            isRefreshing ? 'scale-110' : ''
          }`}
        >
          <RefreshCw
            size={20}
            className={`text-orange-500 transition-transform duration-300 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
      </div>

      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>

      {isRefreshing && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin" />
            Refreshing...
          </div>
        </div>
      )}
    </div>
  );
};
