/**
 * ClickableCard Component
 * A properly accessible, clickable card wrapper that prevents click-blocking issues
 */

import React, { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClickableCardProps {
  /** Route to navigate to on click */
  to?: string;
  /** External URL (opens in new tab) */
  href?: string;
  /** Custom click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Children elements */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Whether to use motion animations */
  animated?: boolean;
  /** Custom ID for debugging */
  debugId?: string;
}

export const ClickableCard = forwardRef<HTMLButtonElement, ClickableCardProps>(
  (
    {
      to,
      href,
      onClick,
      children,
      className,
      disabled = false,
      ariaLabel,
      animated = true,
      debugId,
    },
    ref
  ) => {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
      // NEVER stop propagation - this causes click issues
      // e.stopPropagation();

      if (disabled) {
        e.preventDefault();
        return;
      }

      if (onClick) {
        onClick(e);
      } else if (href) {
        // External link
        window.open(href, "_blank", "noopener,noreferrer");
      } else if (to) {
        // Internal navigation
        navigate(to);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Support Enter and Space for keyboard navigation
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick(e as unknown as React.MouseEvent);
      }
    };

    const baseClasses = cn(
      // Core clickable styles
      "clickable",
      "pointer-events-auto",
      "cursor-pointer",
      "relative",
      "z-50",
      // Reset button styles
      "appearance-none",
      "border-0",
      "bg-transparent",
      "text-left",
      "w-full",
      // Focus styles for accessibility
      "focus:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-orange-500",
      "focus-visible:ring-offset-2",
      // Disabled styles
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    );

    const content = (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={baseClasses}
        disabled={disabled}
        aria-label={ariaLabel}
        data-debug-id={debugId}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        {children}
      </button>
    );

    if (animated) {
      return (
        <motion.div
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="pointer-events-auto"
        >
          {content}
        </motion.div>
      );
    }

    return content;
  }
);

ClickableCard.displayName = "ClickableCard";

export default ClickableCard;
