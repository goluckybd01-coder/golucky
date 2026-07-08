import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Props = HTMLMotionProps<"div"> & { children: React.ReactNode };

const GlassCard = forwardRef<HTMLDivElement, Props>(({ className, children, ...rest }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 24, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className={cn("luxe-card p-6 sm:p-7", className)}
    {...rest}
  >
    {children}
  </motion.div>
));

GlassCard.displayName = "GlassCard";
export default GlassCard;
