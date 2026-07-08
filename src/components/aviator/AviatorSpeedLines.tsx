import { useEffect, useState, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeedLine {
  id: number;
  x: number;
  y: number;
  length: number;
  thickness: number;
  opacity: number;
  angle: number;
}

interface AviatorSpeedLinesProps {
  show: boolean;
  intensity: number;
}

export const AviatorSpeedLines = forwardRef<HTMLDivElement, AviatorSpeedLinesProps>(
  function AviatorSpeedLines({ show, intensity }, ref) {
  const [lines, setLines] = useState<SpeedLine[]>([]);
  const intensityRef = useRef(intensity);
  
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    if (!show) {
      setLines([]);
      return;
    }

    const interval = setInterval(() => {
      const currentIntensity = intensityRef.current;
      const baseCount = 8;
      const extraLines = Math.min(Math.floor((currentIntensity - 10) / 5) * 3, 12);
      const lineCount = baseCount + extraLines;
      const newLines: SpeedLine[] = [];
      
      for (let i = 0; i < 3; i++) {
        newLines.push({
          id: Date.now() + Math.random() * 1000,
          x: 20 + Math.random() * 70,
          y: 10 + Math.random() * 80,
          length: 30 + Math.random() * 60 + (currentIntensity - 10) * 2,
          thickness: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.4,
          angle: -15 + Math.random() * 10,
        });
      }

      setLines(prev => [...prev, ...newLines].slice(-lineCount));
    }, 80);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const getLineColor = (opacity: number) => {
    if (intensity >= 20) return `hsl(var(--aviator-speedline-ultra) / ${opacity})`;
    if (intensity >= 15) return `hsl(var(--aviator-speedline-hi) / ${opacity})`;
    return `hsl(var(--aviator-speedline) / ${opacity})`;
  };

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {lines.map((line) => (
          <motion.div
            key={line.id}
            initial={{ left: `${line.x}%`, top: `${line.y}%`, width: 0, opacity: line.opacity }}
            animate={{ left: `${line.x - 15}%`, width: line.length, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute"
            style={{
              height: line.thickness,
              background: `linear-gradient(90deg, transparent, ${getLineColor(line.opacity)}, transparent)`,
              transform: `rotate(${line.angle}deg)`,
              borderRadius: '2px',
              boxShadow: intensity >= 15 ? `0 0 ${line.thickness * 3}px ${getLineColor(line.opacity * 0.5)}` : 'none',
            }}
          />
        ))}
      </AnimatePresence>
      {intensity >= 20 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 30%, transparent 30%, rgba(255, 160, 80, 0.12) 60%, transparent 80%)' }} />
      )}
    </div>
  );
  }
);

export default AviatorSpeedLines;
