import { useState, useCallback, useRef } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  scale: number;
}

interface UseParallaxTiltOptions {
  maxTilt?: number;
  scale?: number;
  perspective?: number;
}

export const useParallaxTilt = (options: UseParallaxTiltOptions = {}) => {
  const { maxTilt = 10, scale = 1.02, perspective = 1000 } = options;
  
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, scale: 1 });
  const elementRef = useRef<HTMLElement | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Calculate mouse position relative to element center (0 to 1, centered at 0.5)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Convert to -1 to 1 range (centered at 0)
    const centerX = x - 0.5;
    const centerY = y - 0.5;
    
    // Calculate rotation (inverted for natural feel)
    const rotateX = centerY * -maxTilt;
    const rotateY = centerX * maxTilt;
    
    setTilt({ rotateX, rotateY, scale });
  }, [maxTilt, scale]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  const tiltStyle: React.CSSProperties = {
    transform: `perspective(${perspective}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
    transition: tilt.rotateX === 0 && tilt.rotateY === 0 
      ? 'transform 0.5s ease-out' 
      : 'transform 0.1s ease-out',
    transformStyle: 'preserve-3d',
  };

  return {
    tiltStyle,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
    tilt,
  };
};
