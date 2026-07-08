/**
 * Shared toast types - decoupled to prevent circular dependencies
 * between hooks/use-toast.ts and components/ui/toast.tsx
 */
import * as React from "react";

export interface ToastProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
  className?: string;
}

export type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick?: () => void;
}>;
