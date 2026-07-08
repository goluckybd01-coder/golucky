import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import type { RoundPhase } from "@/pages/games/AviatorGame";
import AviatorCrashParticles from "./AviatorCrashParticles";
import AviatorExhaustTrail from "./AviatorExhaustTrail";
import AviatorSpeedLines from "./AviatorSpeedLines";
import AviatorPlaneLoader from "./AviatorPlaneLoader";
import AviatorPlaneSprite from "./AviatorPlaneSprite";
import { Slider } from "@/components/ui/slider";

interface AviatorGamePanelProps {
  phase: RoundPhase;
  multiplier: number;
  visualMultiplier?: number; // Visual-only multiplier for plane/curve animation (+25% faster)
  countdown: number;
  crashPoint: number;
  playerCount?: number;
  roundId?: string;
  ping?: number;
  // Sound control
  soundEnabled?: boolean;
  soundVolume?: number;
  onToggleSound?: () => void;
  onSetVolume?: (volume: number) => void;
}

const AviatorGamePanel = ({ 
  phase, 
  multiplier, 
  visualMultiplier,
  countdown, 
  crashPoint, 
  playerCount = 4549,
  roundId = "10678099",
  ping = 295,
  soundEnabled = true,
  soundVolume = 0.5,
  onToggleSound,
  onSetVolume,
}: AviatorGamePanelProps) => {
  const readCssHsl = (varName: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return raw || fallback;
  };

  const hsl = (varName: string, alpha = 1, fallback = "0 0% 100%") => {
    const v = readCssHsl(varName, fallback);
    return `hsl(${v} / ${alpha})`;
  };

  // Use visualMultiplier for curve/plane drawing (+25% faster visual speed)
  const drawMultiplier = visualMultiplier ?? multiplier;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shake, setShake] = useState(false);
  const [planePosition, setPlanePosition] = useState({ x: 0, y: 95, angle: -30, visible: false });
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const volumePanelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pulseRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Particle system for curve tip
  interface TipParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    alpha: number;
  }
  const particlesRef = useRef<TipParticle[]>([]);
  const lastTipPosRef = useRef({ x: 0, y: 0 });
  
  // Auto-hide volume panel after inactivity
  const resetVolumeTimeout = () => {
    if (volumePanelTimeoutRef.current) {
      clearTimeout(volumePanelTimeoutRef.current);
    }
    volumePanelTimeoutRef.current = setTimeout(() => {
      setShowVolumePanel(false);
    }, 3000);
  };
  
  // Handle volume button click - toggle panel
  const handleVolumeButtonClick = () => {
    if (showVolumePanel) {
      setShowVolumePanel(false);
      if (volumePanelTimeoutRef.current) {
        clearTimeout(volumePanelTimeoutRef.current);
      }
    } else {
      setShowVolumePanel(true);
      resetVolumeTimeout();
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (volumePanelTimeoutRef.current) {
        clearTimeout(volumePanelTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle crash shake animation
  useEffect(() => {
    if (phase === "CRASHED") {
      setShake(true);
      setTimeout(() => setShake(false), 700);
    }
  }, [phase]);
  
  // Draw the curve with pulsing glow (plane is now HTML element)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;

    // Snapshot aviator palette from design tokens (HSL)
    const palette = {
      curveMain: hsl("--aviator-curve-main", 1, "16 95% 56%"),
      curveGlowOuter: (a: number) => hsl("--aviator-curve-glow-outer", a, "18 100% 58%"),
      curveGlowMid: (a: number) => hsl("--aviator-curve-glow-mid", a, "20 100% 64%"),
      curveCore: (a: number) => hsl("--aviator-curve-core", a, "18 100% 78%"),
      fill1: (a: number) => hsl("--aviator-curve-fill-1", a, "18 100% 56%"),
      fill2: (a: number) => hsl("--aviator-curve-fill-2", a, "16 92% 49%"),
      fill3: (a: number) => hsl("--aviator-curve-fill-3", a, "10 85% 42%"),
      fill4: (a: number) => hsl("--aviator-curve-fill-4", a, "8 80% 35%"),
      fill5: (a: number) => hsl("--aviator-curve-fill-5", a, "6 75% 26%"),
    };
    
    // Animation loop for pulsing effect
    const animate = () => {
      // Update pulse value (0 to 1 oscillation)
      pulseRef.current = (pulseRef.current + 0.03) % (Math.PI * 2);
      const pulseValue = (Math.sin(pulseRef.current) + 1) / 2; // 0 to 1
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw dark diagonal rays background
      ctx.save();
      const rayCount = 20;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      
      for (let i = 0; i < rayCount; i++) {
        const angle1 = (i / rayCount) * Math.PI * 2 - Math.PI / 2;
        const angle2 = ((i + 0.5) / rayCount) * Math.PI * 2 - Math.PI / 2;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle1) * width, centerY + Math.sin(angle1) * height);
        ctx.lineTo(centerX + Math.cos(angle2) * width, centerY + Math.sin(angle2) * height);
        ctx.closePath();
        
        ctx.fillStyle = i % 2 === 0 ? 'rgba(25, 30, 40, 0.9)' : 'rgba(15, 18, 25, 0.95)';
        ctx.fill();
      }
      ctx.restore();
      
      if (phase === "WAITING") {
        // Don't draw text here - using AviatorPlaneLoader component instead
        setPlanePosition(prev => ({ ...prev, visible: false }));
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Calculate curve based on VISUAL multiplier (+25% faster for plane/curve animation)
      const maxMult = 10;
      const progress = Math.min((drawMultiplier - 1) / (maxMult - 1), 1);
      
      // Intensity factor based on multiplier (higher multiplier = stronger pulse)
      const intensityFactor = Math.min(drawMultiplier / 5, 2); // Caps at 2x intensity at 10x multiplier
      const pulseIntensity = 0.15 + (intensityFactor * 0.25); // 0.15 to 0.65 pulse range
      const currentPulse = 1 + (pulseValue * pulseIntensity);
      
      // Starting point at bottom left corner - moved further left and down
      const startX = 0;
      const startY = height - 10; // Closer to bottom
      
      // End point moves up and right based on multiplier
      const endX = startX + progress * width * 0.75;
      const endY = startY - progress * height * 0.7;
      
      // Control point for exponential-like curve
      const controlX = startX + (endX - startX) * 0.7;
      const controlY = startY - (startY - endY) * 0.15;
      
      // ========================================
      // PULSING GLOW AURA (behind everything)
      // ========================================
      if (phase === "RUNNING" && drawMultiplier >= 1.5) {
        const glowOpacity = 0.12 + (pulseValue * 0.18 * intensityFactor);
        const glowWidth = 50 + (pulseValue * 25 * intensityFactor);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.lineTo(endX, height);
        ctx.lineTo(startX, height);
        ctx.closePath();
        
        // Pulsing outer glow
        ctx.shadowColor = palette.curveGlowOuter(glowOpacity);
        ctx.shadowBlur = glowWidth;
        ctx.fillStyle = palette.fill2(0.12 + pulseValue * 0.12);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // ========================================
      // FILLED AREA UNDER CURVE - SMOOTHER & LIGHTER
      // ========================================
      
      // Base opacity reduced for smoother look (0.45-0.55 range)
      const baseOpacity = 0.48 + (pulseValue * 0.10 * intensityFactor);
      
      // Create vertical gradient for the fill area (top = stronger, bottom = lighter)
      const areaGradient = ctx.createLinearGradient(0, endY, 0, height);
      areaGradient.addColorStop(0, palette.fill1(Math.min(baseOpacity + 0.10, 0.60)));
      areaGradient.addColorStop(0.2, palette.fill2(Math.min(baseOpacity, 0.52)));
      areaGradient.addColorStop(0.5, palette.fill3(Math.min(baseOpacity - 0.10, 0.42)));
      areaGradient.addColorStop(0.8, palette.fill4(Math.min(baseOpacity - 0.20, 0.30)));
      areaGradient.addColorStop(1, palette.fill5(Math.min(baseOpacity - 0.30, 0.18)));
      
      // Draw filled area - extends to VERY BOTTOM of canvas
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.lineTo(endX, height); // Go to bottom edge at current X
      ctx.lineTo(startX, height); // Go to bottom-left corner
      ctx.closePath();
      ctx.fillStyle = areaGradient;
      ctx.fill();
      
      // Add subtle glow overlay near the curve (reduced intensity)
      const overlayOpacity = 0.18 + (pulseValue * 0.14 * intensityFactor);
      const overlayGradient = ctx.createLinearGradient(0, endY, 0, startY);
      overlayGradient.addColorStop(0, palette.curveGlowMid(overlayOpacity));
      overlayGradient.addColorStop(1, palette.fill1(0.03));
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.lineTo(endX, height);
      ctx.lineTo(startX, height);
      ctx.closePath();
      ctx.fillStyle = overlayGradient;
      ctx.fill();
      
      // ========================================
      // MAIN CURVE LINE - REDUCED THICKNESS (~30% thinner)
      // ========================================
      
      // Outer glow layer - reduced by 30%
      const outerGlowWidth = 16 + (pulseValue * 8 * intensityFactor); // was 24 + 12
      const outerGlowOpacity = 0.18 + (pulseValue * 0.12 * intensityFactor);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.strokeStyle = palette.curveGlowOuter(outerGlowOpacity);
      ctx.lineWidth = outerGlowWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Mid glow layer - reduced by 30%
      const midGlowWidth = 11 + (pulseValue * 5 * intensityFactor); // was 16 + 8
      const midGlowOpacity = 0.28 + (pulseValue * 0.17 * intensityFactor);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.strokeStyle = palette.curveGlowMid(midGlowOpacity);
      ctx.lineWidth = midGlowWidth;
      ctx.stroke();
      
      // Main curve line - 7-9px on mobile (was 10-12)
      const mainLineWidth = 7 + (pulseValue * 1.5 * intensityFactor);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.strokeStyle = palette.curveMain;
      ctx.lineWidth = mainLineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Bright core highlight - slightly reduced
      const coreOpacity = 0.45 + (pulseValue * 0.28 * intensityFactor);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.strokeStyle = palette.curveCore(coreOpacity);
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Extra bright tip at the end for high multipliers (slightly smaller)
      if (drawMultiplier >= 3) {
        const tipGlow = pulseValue * intensityFactor;
        ctx.beginPath();
        ctx.arc(endX, endY, 6 + tipGlow * 4, 0, Math.PI * 2); // was 8 + 6
        ctx.fillStyle = palette.curveCore(0.40 + tipGlow * 0.28);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(endX, endY, 3 + tipGlow * 2, 0, Math.PI * 2); // was 4 + 3
        ctx.fillStyle = hsl("--aviator-curve-core", 0.55 + tipGlow * 0.22, "18 100% 90%");
        ctx.fill();
      }
      
      // ========================================
      // PARTICLE TRAILS FROM CURVE TIP
      // ========================================
      if (phase === "RUNNING" && drawMultiplier >= 1.2) {
        // Spawn new particles based on multiplier intensity
        const particleSpawnRate = Math.min(3 + Math.floor(drawMultiplier / 2), 8);
        const particleSpeed = 1 + (drawMultiplier / 5);
        
        // Color palette based on multiplier
        const getParticleColor = () => {
          if (drawMultiplier >= 10) {
            // Gold/yellow for legendary
            const colors = [
              hsl("--aviator-exhaust-gold-2", 1, "48 100% 50%"),
              hsl("--aviator-exhaust-gold-1", 1, "40 100% 65%"),
              hsl("--aviator-speedline-ultra", 1, "40 100% 68%"),
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          } else if (drawMultiplier >= 5) {
            // Cyan/blue for high
            const colors = [
              hsl("--aviator-plane-1", 1, "16 95% 56%"),
              hsl("--aviator-exhaust-1", 1, "16 100% 58%"),
              hsl("--aviator-exhaust-2", 1, "10 90% 54%"),
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          } else if (drawMultiplier >= 3) {
            // Orange/red for medium-high
            const colors = [
              hsl("--aviator-exhaust-2", 1, "10 90% 54%"),
              hsl("--aviator-plane-2", 1, "356 84% 46%"),
              hsl("--aviator-plane-3", 1, "0 70% 45%"),
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          } else {
            // Red/pink for low
            const colors = [
              hsl("--aviator-curve-main", 1, "16 95% 56%"),
              hsl("--aviator-exhaust-3", 1, "8 85% 50%"),
              hsl("--aviator-exhaust-4", 1, "6 80% 46%"),
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          }
        };
        
        // Spawn particles
        for (let i = 0; i < particleSpawnRate; i++) {
          // Calculate velocity based on curve direction (opposite to movement)
          const angle = Math.atan2(endY - lastTipPosRef.current.y, endX - lastTipPosRef.current.x);
          const spreadAngle = angle + Math.PI + (Math.random() - 0.5) * 1.5; // Spread behind
          const speed = particleSpeed * (0.5 + Math.random() * 1.5);
          
          particlesRef.current.push({
            x: endX + (Math.random() - 0.5) * 8,
            y: endY + (Math.random() - 0.5) * 8,
            vx: Math.cos(spreadAngle) * speed + (Math.random() - 0.5) * 0.5,
            vy: Math.sin(spreadAngle) * speed + (Math.random() - 0.5) * 0.5 + 0.3, // slight gravity
            life: 1,
            maxLife: 30 + Math.random() * 30,
            size: 2 + Math.random() * (drawMultiplier >= 5 ? 5 : 3),
            color: getParticleColor(),
            alpha: 0.8 + Math.random() * 0.2,
          });
        }
        
        // Update last tip position
        lastTipPosRef.current = { x: endX, y: endY };
        
        // Limit particle count
        if (particlesRef.current.length > 150) {
          particlesRef.current = particlesRef.current.slice(-100);
        }
      }
      
      // Update and draw particles
      const particlesToRemove: number[] = [];
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.02; // Gravity
        particle.vx *= 0.99; // Air resistance
        particle.life -= 1 / particle.maxLife;
        
        if (particle.life <= 0) {
          particlesToRemove.push(index);
          return;
        }
        
        // Draw particle with fade
        const fadeAlpha = particle.life * particle.alpha;
        const fadeSize = particle.size * (0.5 + particle.life * 0.5);
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, fadeSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(')', `, ${fadeAlpha * 0.3})`).replace('rgb', 'rgba').replace('#', '');
        // Handle hex colors
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        ctx.fillStyle = hexToRgba(particle.color, fadeAlpha * 0.3);
        ctx.fill();
        
        // Core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, fadeSize, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(particle.color, fadeAlpha);
        ctx.fill();
        
        // Bright center for larger particles
        if (fadeSize > 3) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, fadeSize * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha * 0.8})`;
          ctx.fill();
        }
      });
      
      // Remove dead particles (reverse order to maintain indices)
      particlesToRemove.reverse().forEach(index => {
        particlesRef.current.splice(index, 1);
      });
      
      // Clear particles on crash
      if (phase === "CRASHED") {
        particlesRef.current = [];
      }
      
      // Calculate plane position for HTML element
      if (phase === "RUNNING" || phase === "CRASHED") {
        const t = 0.98;
        const px = (1-t)*(1-t)*startX + 2*(1-t)*t*controlX + t*t*endX;
        const py = (1-t)*(1-t)*startY + 2*(1-t)*t*controlY + t*t*endY;
        const angle = Math.atan2(endY - py, endX - px);
        
        // Convert canvas coordinates to percentage
        const xPercent = (endX / width) * 100;
        const yPercent = (endY / height) * 100;
        const angleDeg = angle * (180 / Math.PI);
        
        setPlanePosition({ x: xPercent, y: yPercent, angle: angleDeg, visible: true });
      }
      
      // Continue animation loop during RUNNING phase
      if (phase === "RUNNING") {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, drawMultiplier, countdown]);
  
  // Player avatars
  const avatars = ["🦁", "🐯", "🦊"];
  
  return (
    <div className="mx-2 rounded-2xl overflow-hidden relative bg-[#0d1117]">
      {/* CSS Keyframes for plane bobbing, propeller spin, and crash shake animation */}
      <style>{`
        @keyframes crashShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-8px, -4px) rotate(-1deg); }
          20% { transform: translate(8px, 4px) rotate(1deg); }
          30% { transform: translate(-6px, 2px) rotate(-0.5deg); }
          40% { transform: translate(6px, -2px) rotate(0.5deg); }
          50% { transform: translate(-4px, 4px) rotate(-0.5deg); }
          60% { transform: translate(4px, -4px) rotate(0.5deg); }
          70% { transform: translate(-3px, 2px) rotate(0deg); }
          80% { transform: translate(3px, -2px) rotate(0deg); }
          90% { transform: translate(-1px, 1px) rotate(0deg); }
        }
        .animate-crash-shake {
          animation: crashShake 0.7s ease-out;
        }
        @keyframes planeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes propellerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes planeGlowBase {
          0%, 100% { filter: drop-shadow(0 0 12px hsl(var(--aviator-plane-solid) / 0.95)) drop-shadow(0 0 26px hsl(var(--aviator-plane-1) / 0.75)) drop-shadow(0 0 56px hsl(var(--aviator-plane-2) / 0.45)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.6)); }
          50% { filter: drop-shadow(0 0 18px hsl(var(--aviator-plane-solid) / 1)) drop-shadow(0 0 38px hsl(var(--aviator-plane-1) / 0.85)) drop-shadow(0 0 70px hsl(var(--aviator-plane-2) / 0.55)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.6)); }
        }
        @keyframes planeGlowIntense {
          0%, 100% { filter: drop-shadow(0 0 20px hsl(var(--aviator-curve-glow-mid) / 0.9)) drop-shadow(0 0 35px hsl(var(--aviator-curve-glow-outer) / 0.7)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5)); }
          50% { filter: drop-shadow(0 0 32px hsl(var(--aviator-curve-core) / 1)) drop-shadow(0 0 50px hsl(var(--aviator-curve-glow-mid) / 0.8)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5)); }
        }
        @keyframes planeGlowGolden {
          0%, 100% { filter: drop-shadow(0 0 26px hsl(var(--aviator-exhaust-gold-1) / 0.95)) drop-shadow(0 0 45px hsl(var(--aviator-exhaust-gold-2) / 0.75)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5)); }
          50% { filter: drop-shadow(0 0 40px hsl(var(--aviator-exhaust-gold-1) / 1)) drop-shadow(0 0 65px hsl(var(--aviator-exhaust-gold-2) / 0.85)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5)); }
        }
        .planeSprite {
          animation: planeFloat 0.9s ease-in-out infinite, planeGlowBase 1.5s ease-in-out infinite;
        }
        .planeSprite.glow-intense {
          animation: planeFloat 0.9s ease-in-out infinite, planeGlowIntense 1s ease-in-out infinite;
        }
        .planeSprite.glow-golden {
          animation: planeFloat 0.9s ease-in-out infinite, planeGlowGolden 0.8s ease-in-out infinite;
        }
        .propeller-group, .propeller-group-new {
          transform-origin: 178px 48px;
          animation: propellerSpin 0.15s linear infinite;
        }
        .propeller-group-new.spin-fast {
          animation: propellerSpin 0.075s linear infinite;
        }
        .propeller-group-new.spin-ultra {
          animation: propellerSpin 0.05s linear infinite;
        }
      `}</style>
      
      {/* Info row - Round ID and Ping */}
      <div className="absolute top-2 left-0 right-0 z-10 flex justify-between px-3">
        <span className="text-gray-500 text-xs">Round ID: {roundId}</span>
        <span className="text-gray-500 text-xs">Ping: {ping}ms</span>
      </div>
      
      {/* Canvas for curve - with zoom effect at high multipliers */}
      <div 
        className={`relative ${shake ? 'animate-crash-shake' : ''}`}
        style={{ 
          aspectRatio: '16/10',
          background: 'radial-gradient(ellipse at center, #1b4332 0%, #0d1b2a 55%, #060d18 100%)',
          transform: phase === "RUNNING" 
            ? `scale(${multiplier >= 10 ? 1.06 : multiplier >= 5 ? 1.03 : 1})` 
            : 'scale(1)',
          transformOrigin: 'center center',
          transition: 'transform 0.5s ease-out',
        }}
      >
        <canvas 
          ref={canvasRef}
          width={640}
          height={400}
          className="w-full h-full"
        />
        
        {/* Waiting Plane Loader - Centered emblem with spinning rings */}
        {phase === "WAITING" && (
          <AviatorPlaneLoader countdown={countdown} />
        )}
        
        {/* Speed Lines at 10x+ */}
        <AviatorSpeedLines show={phase === "RUNNING" && multiplier >= 10} intensity={multiplier} />
        
        {/* Engine Exhaust Trail */}
        <AviatorExhaustTrail 
          show={phase === "RUNNING"} 
          planeX={planePosition.x} 
          planeY={planePosition.y} 
          planeAngle={planePosition.angle}
          multiplier={multiplier}
        />
        
        {/* Plane sprite (screenshot-like) + CRASHED fly-away wave */}
        {planePosition.visible && (
          <AviatorPlaneSprite
            phase={phase}
            multiplier={multiplier}
            xPercent={planePosition.x}
            yPercent={planePosition.y}
            angleDeg={planePosition.angle}
          />
        )}
        
        {/* Multiplier display - centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {phase === "CRASHED" ? (
              <motion.div
                key="crashed"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="text-xl font-bold text-red-500 mb-1">
                  FLEW AWAY!
                </div>
                <div 
                  className="text-5xl font-bold text-white"
                  style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
                >
                  {crashPoint.toFixed(2)}x
                </div>
              </motion.div>
            ) : phase === "RUNNING" ? (
              <motion.div
                key="running"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-6xl font-bold"
                style={{
                  color: '#ffffff',
                  textShadow: '0 0 40px rgba(255,255,255,0.3)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {multiplier.toFixed(2)}x
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        
        {/* Quick volume control - top right */}
        {onToggleSound && (
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
            {/* Volume button */}
            <button
              onClick={handleVolumeButtonClick}
              className={`p-2 rounded-full transition-all active:scale-95 border ${
                soundEnabled 
                  ? 'bg-black/70 hover:bg-black/90 border-[#2ECC71]/50' 
                  : 'bg-gray-800/90 hover:bg-gray-700 border-gray-600/50'
              }`}
              aria-label={soundEnabled ? "Volume controls" : "Sound muted"}
            >
              {!soundEnabled ? (
                <VolumeX className="w-5 h-5 text-gray-400" />
              ) : soundVolume > 0.5 ? (
                <Volume2 className="w-5 h-5 text-[#2ECC71]" />
              ) : soundVolume > 0 ? (
                <Volume1 className="w-5 h-5 text-[#2ECC71]" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {/* Volume panel popup */}
            <AnimatePresence>
              {showVolumePanel && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[#1a1a1a]/95 backdrop-blur-sm border border-gray-700 rounded-xl p-3 shadow-xl min-w-[160px]"
                  onMouseEnter={() => {
                    if (volumePanelTimeoutRef.current) {
                      clearTimeout(volumePanelTimeoutRef.current);
                    }
                  }}
                  onMouseLeave={resetVolumeTimeout}
                >
                  {/* Mute toggle */}
                  <button
                    onClick={onToggleSound}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors mb-2 ${
                      soundEnabled
                        ? 'bg-[#2ECC71]/20 text-[#2ECC71] hover:bg-[#2ECC71]/30'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Sound ON
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Muted
                      </>
                    )}
                  </button>
                  
                  {/* Volume slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Master Volume</span>
                      <span className="text-xs text-white font-medium">{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-3 h-3 text-gray-500" />
                      <Slider
                        value={[soundVolume * 100]}
                        onValueChange={([v]) => {
                          onSetVolume?.(v / 100);
                          resetVolumeTimeout();
                        }}
                        min={0}
                        max={100}
                        step={5}
                        disabled={!soundEnabled}
                        className={`flex-1 ${!soundEnabled ? 'opacity-50' : ''}`}
                      />
                      <Volume2 className="w-3 h-3 text-gray-500" />
                    </div>
                  </div>
                  
                  {/* Quick preset buttons */}
                  <div className="flex gap-1 mt-2">
                    {[25, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          onSetVolume?.(preset / 100);
                          if (!soundEnabled) onToggleSound?.();
                          resetVolumeTimeout();
                        }}
                        className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors ${
                          Math.round(soundVolume * 100) === preset && soundEnabled
                            ? 'bg-[#2ECC71] text-white'
                            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Player count indicator - bottom right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 rounded-full px-3 py-1.5">
          <div className="flex -space-x-2">
            {avatars.map((avatar, i) => (
              <div 
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs border-2 border-black"
              >
                {avatar}
              </div>
            ))}
          </div>
          <span className="text-white font-semibold text-sm ml-1">{playerCount.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Crash particle effects - positioned at plane location */}
      <AviatorCrashParticles 
        show={phase === "CRASHED"} 
        originX={planePosition.x || 70} 
        originY={planePosition.y || 30} 
      />
      
      {/* Crashed overlay flash */}
      {phase === "CRASHED" && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-red-600/30 pointer-events-none"
        />
      )}
    </div>
  );
};

export default AviatorGamePanel;
