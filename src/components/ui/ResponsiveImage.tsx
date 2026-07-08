import React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Provide when known to reserve layout space and prevent CLS. */
  width?: number;
  height?: number;
  /** LCP hero? Set true to skip lazy-loading and hint the browser. */
  priority?: boolean;
};

/**
 * ResponsiveImage
 * - lazy + async decode by default (skipped when `priority`)
 * - sensible `sizes` attribute for mobile-first layouts
 * - forwards all other <img> props
 *
 * Use for banners, logos, and any static art. For decorative images,
 * pass alt="" so screen readers skip them.
 */
export const ResponsiveImage = React.forwardRef<HTMLImageElement, Props>(
  ({ priority, sizes, loading, decoding, fetchPriority, ...rest }, ref) => {
    return (
      <img
        ref={ref}
        loading={loading ?? (priority ? "eager" : "lazy")}
        decoding={decoding ?? "async"}
        fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
        sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        {...rest}
      />
    );
  }
);
ResponsiveImage.displayName = "ResponsiveImage";

export default ResponsiveImage;
