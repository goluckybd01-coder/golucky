import React, { useState, useCallback } from 'react';

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  maxTilt?: number;
  scale?: number;
}

const ParallaxCard: React.FC<ParallaxCardProps> = ({
  children,
  className = '',
  style = {},
  onClick,
  disabled = false,
  maxTilt = 8,
  scale = 1.02,
}) => {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const centerX = x - 0.5;
    const centerY = y - 0.5;

    setTilt({
      rotateX: centerY * -maxTilt,
      rotateY: centerX * maxTilt,
      isHovered: true,
    });
  }, [disabled, maxTilt]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, isHovered: false });
  }, []);

  const parallaxStyle: React.CSSProperties = {
    ...style,
    transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.isHovered && !disabled ? scale : 1})`,
    transition: !tilt.isHovered
      ? 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
      : 'transform 0.1s ease-out',
    transformStyle: 'preserve-3d' as const,
    cursor: disabled ? 'default' : 'pointer',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={className}
      style={parallaxStyle}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default ParallaxCard;
