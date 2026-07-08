import { useEffect, useState } from "react";

interface TokenLogoProps {
  src?: string;
  symbol: string;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Renders an asset/token logo image with a graceful fallback to the
 * symbol initials when the image is missing or fails to load.
 */
export function TokenLogo({
  src,
  symbol,
  name,
  className = "w-full h-full object-cover",
  fallbackClassName = "text-[11px] font-bold",
}: TokenLogoProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  const initials = (symbol?.split("/")[0] ?? symbol ?? "?").slice(0, 3).toUpperCase();

  if (!src || errored) {
    return <span className={fallbackClassName}>{initials}</span>;
  }

  return (
    <img
      src={src}
      alt={name ?? symbol}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

export default TokenLogo;
