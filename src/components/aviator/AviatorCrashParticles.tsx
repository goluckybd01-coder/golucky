import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  type: 'spark' | 'debris' | 'smoke' | 'ember';
  delay: number;
}

interface AviatorCrashParticlesProps {
  show: boolean;
  originX?: number;
  originY?: number;
}

const SPARK_COLORS = ['#ff6b35', '#ff8c42', '#ffb347', '#ffd700', '#ff4444', '#ff6666'];
const DEBRIS_COLORS = ['#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'];
const SMOKE_COLORS = ['rgba(100,100,100,0.6)', 'rgba(80,80,80,0.5)', 'rgba(60,60,60,0.4)'];

export function AviatorCrashParticles({ show, originX = 70, originY = 30 }: AviatorCrashParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const speed = 20 + Math.random() * 10;
        newParticles.push({
          id: i, x: originX, y: originY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 4, color: '#ffffff',
          rotation: Math.random() * 360, rotationSpeed: 0, type: 'spark', delay: 0,
        });
      }
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 18;
        newParticles.push({
          id: 16 + i, x: originX, y: originY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 5,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
          rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 1200,
          type: 'spark', delay: Math.random() * 30,
        });
      }
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 10;
        newParticles.push({
          id: 51 + i, x: originX, y: originY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
          size: 8 + Math.random() * 14,
          color: DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)],
          rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 600,
          type: 'debris', delay: Math.random() * 60,
        });
      }
      for (let i = 0; i < 25; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
        const speed = 3 + Math.random() * 6;
        newParticles.push({
          id: 71 + i,
          x: originX + (Math.random() - 0.5) * 12, y: originY + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          color: SPARK_COLORS[Math.floor(Math.random() * 3)],
          rotation: 0, rotationSpeed: 0, type: 'ember', delay: 80 + Math.random() * 180,
        });
      }
      for (let i = 0; i < 12; i++) {
        newParticles.push({
          id: 96 + i,
          x: originX + (Math.random() - 0.5) * 10, y: originY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3,
          size: 25 + Math.random() * 40,
          color: SMOKE_COLORS[Math.floor(Math.random() * SMOKE_COLORS.length)],
          rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 60,
          type: 'smoke', delay: Math.random() * 80,
        });
      }
      setParticles(newParticles);
      const timeout = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timeout);
    } else {
      setParticles([]);
    }
  }, [show, originX, originY]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <AnimatePresence>
        {particles.map((particle) => (
          <CrashParticle key={particle.id} particle={particle} />
        ))}
      </AnimatePresence>
      <motion.div initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 2.5 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute" style={{ left: `${originX}%`, top: `${originY}%`, transform: 'translate(-50%, -50%)', width: '80px', height: '80px', background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 20%, rgba(255,240,200,0.7) 40%, transparent 70%)`, borderRadius: '50%', boxShadow: '0 0 60px 30px rgba(255,255,255,0.8), 0 0 100px 50px rgba(255,200,100,0.5)' }} />
      <motion.div initial={{ opacity: 0.9, scale: 0.3 }} animate={{ opacity: 0, scale: 3 }} transition={{ duration: 0.25, ease: "easeOut", delay: 0.02 }} className="absolute" style={{ left: `${originX}%`, top: `${originY}%`, transform: 'translate(-50%, -50%)', width: '120px', height: '120px', border: '4px solid rgba(255,255,255,0.9)', borderRadius: '50%', boxShadow: '0 0 20px 10px rgba(255,255,255,0.5)' }} />
      <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="absolute inset-0" style={{ background: `radial-gradient(circle at ${originX}% ${originY}%, rgba(255,150,50,0.7) 0%, rgba(255,80,50,0.4) 25%, rgba(255,50,50,0.2) 45%, transparent 65%)` }} />
    </div>
  );
}

function CrashParticle({ particle }: { particle: Particle }) {
  const duration = particle.type === 'smoke' ? 1.5 : particle.type === 'ember' ? 1.8 : 1;
  const gravity = particle.type === 'debris' ? 15 : particle.type === 'ember' ? -3 : 8;
  const endX = particle.x + particle.vx * 3;
  const endY = particle.y + particle.vy * 3 + gravity;

  if (particle.type === 'smoke') {
    return (
      <motion.div initial={{ left: `${particle.x}%`, top: `${particle.y}%`, scale: 0.5, opacity: 0.7 }} animate={{ left: `${endX}%`, top: `${endY}%`, scale: 2.5, opacity: 0 }} transition={{ duration, delay: particle.delay / 1000, ease: "easeOut" }} className="absolute rounded-full" style={{ width: particle.size, height: particle.size, background: particle.color, filter: 'blur(8px)' }} />
    );
  }
  if (particle.type === 'ember') {
    return (
      <motion.div initial={{ left: `${particle.x}%`, top: `${particle.y}%`, scale: 1, opacity: 1 }} animate={{ left: [`${particle.x}%`, `${particle.x + particle.vx}%`, `${endX}%`], top: [`${particle.y}%`, `${particle.y + particle.vy * 2}%`, `${endY}%`], scale: [1, 1.2, 0], opacity: [1, 0.8, 0] }} transition={{ duration, delay: particle.delay / 1000, ease: "easeOut" }} className="absolute rounded-full" style={{ width: particle.size, height: particle.size, background: particle.color, boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}` }} />
    );
  }
  if (particle.type === 'spark') {
    return (
      <motion.div initial={{ left: `${particle.x}%`, top: `${particle.y}%`, scale: 1, opacity: 1, rotate: particle.rotation }} animate={{ left: `${endX}%`, top: `${endY}%`, scale: 0, opacity: 0, rotate: particle.rotation + particle.rotationSpeed }} transition={{ duration: 0.6 + Math.random() * 0.4, delay: particle.delay / 1000, ease: "easeOut" }} className="absolute" style={{ width: particle.size, height: particle.size * 3, background: `linear-gradient(to bottom, ${particle.color}, transparent)`, borderRadius: '50%', boxShadow: `0 0 ${particle.size}px ${particle.color}` }} />
    );
  }
  return (
    <motion.div initial={{ left: `${particle.x}%`, top: `${particle.y}%`, scale: 1, opacity: 1, rotate: particle.rotation }} animate={{ left: `${endX}%`, top: `${endY}%`, scale: 0.3, opacity: 0, rotate: particle.rotation + particle.rotationSpeed }} transition={{ duration, delay: particle.delay / 1000, ease: "easeOut" }} className="absolute" style={{ width: particle.size, height: particle.size * 0.6, background: particle.color, borderRadius: '2px', boxShadow: `0 0 ${particle.size / 2}px rgba(255,100,50,0.5)` }} />
  );
}

export default AviatorCrashParticles;
