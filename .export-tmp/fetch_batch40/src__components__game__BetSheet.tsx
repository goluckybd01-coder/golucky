/**
 * BET SHEET COMPONENT
 * 
 * Reusable bottom sheet for placing bets with:
 * - Slide-up animation
 * - Backdrop blur effect
 * - Smooth transitions
 */

import React, { useEffect, useState, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface BetSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  headerColor?: string;
  headerTitle?: string;
  timeRemaining?: number; // Countdown timer in seconds
  footer?: React.ReactNode; // Optional sticky footer (e.g., Confirm/Cancel)
}

const BetSheet: React.FC<BetSheetProps> = ({
  isOpen,
  onClose,
  children,
  headerColor = "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
  headerTitle,
  timeRemaining = 0,
  footer,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle swipe down to close
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current || !sheetRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    
    // Only allow dragging down
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartY.current || !sheetRef.current) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - touchStartY.current;
    
    // If dragged more than 100px, close
    if (deltaY > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = "";
    }
    touchStartY.current = null;
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={handleBackdropClick}
      style={{ 
        background: isAnimating ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        backdropFilter: isAnimating ? "blur(4px)" : "blur(0px)",
        WebkitBackdropFilter: isAnimating ? "blur(4px)" : "blur(0px)",
        transition: "background 0.3s ease-out, backdrop-filter 0.3s ease-out",
      }}
    >
      <div 
        ref={sheetRef}
        className="w-full max-w-[430px] bg-white overflow-hidden flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          borderTopLeftRadius: 22, 
          borderTopRightRadius: 22,
          maxHeight: "70vh",
          height: "70vh",
          transform: isAnimating ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#d1d5db" }} />
        </div>
        
        {timeRemaining > 0 && (
          <div 
            className={`flex items-center justify-center gap-2 py-2 px-4 transition-all ${
              timeRemaining <= 5 
                ? "bg-gradient-to-r from-red-500 to-red-600 animate-pulse" 
                : timeRemaining <= 10 
                  ? "bg-gradient-to-r from-orange-500 to-amber-500" 
                  : "bg-gradient-to-r from-green-500 to-emerald-500"
            }`}
          >
            {timeRemaining <= 5 ? (
              <AlertTriangle className="text-white animate-bounce" size={16} />
            ) : (
              <Clock className="text-white" size={16} />
            )}
            <span className="text-white font-bold text-sm">
              {timeRemaining <= 5 
                ? `⚠️ শেষ ${timeRemaining} সেকেন্ড! দ্রুত বেট করুন!` 
                : timeRemaining <= 10 
                  ? `⏰ মাত্র ${timeRemaining} সেকেন্ড বাকি`
                  : `বেটিং সময়: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
              }
            </span>
            {timeRemaining <= 5 && (
              <AlertTriangle className="text-white animate-bounce" size={16} />
            )}
          </div>
        )}
        
        {timeRemaining <= 0 && isOpen && (
          <div className="bg-gradient-to-r from-red-600 to-red-700 py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="text-white" size={18} />
              <span className="text-white font-bold text-sm">❌ বেটিং বন্ধ - পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন</span>
            </div>
          </div>
        )}
        
        {headerTitle && (
          <div className="py-2.5 text-center" style={{ background: headerColor }}>
            <h3 className="text-white font-bold text-sm">{headerTitle}</h3>
          </div>
        )}
        
        {footer ? (
          <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
        )}

        {footer ? (
          <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">{footer}</div>
        ) : null}
      </div>
      
      <style>{`
        @keyframes betSheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes betSheetSlideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @keyframes backdropFadeIn {
          from { background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
          to { background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); }
        }
      `}</style>
    </div>
  );
};

export default BetSheet;
