 import { motion } from "framer-motion";
 import { shouldReduceMotion } from "@/lib/reducedMotion";

 
 // Floating particle removed for performance (Final Polish Phase 2)
 export const FloatingParticle = (_props: { delay: number; size: number; left: string; duration: number }) => null;

 
 // Premium glowing orb
 export const GlowingOrb = ({ className, color, delay = 0 }: { className?: string; color: string; delay?: number }) => (
   <motion.div 
     className={`absolute rounded-full blur-3xl ${className}`} 
     style={{ background: color }}
     animate={{ 
       opacity: [0.15, 0.35, 0.15],
       scale: [1, 1.15, 1]
     }}
     transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
   />
 );
 
 // Premium holographic shine effect
 export const PremiumHolographicShine = () => (
   <motion.div
     className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
   >
     <motion.div
       className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
       initial={{ x: "-200%" }}
       animate={{ x: "200%" }}
       transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
     />
   </motion.div>
 );
 
 export const WithdrawBackground = () => {
   const reduce = shouldReduceMotion();
   const count = reduce ? 0 : (typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 8);
   return (
   <>
     {/* Animated background particles */}
     <div className="fixed inset-0 pointer-events-none overflow-hidden">
       {[...Array(count)].map((_, i) => (
         <FloatingParticle 
           key={i} 
           delay={i * 0.5} 
           size={Math.random() * 15 + 8}
           left={`${Math.random() * 100}%`}
           duration={Math.random() * 10 + 14}
         />
       ))}
     </div>

 
     {/* Glowing orbs */}
     <GlowingOrb className="w-[500px] h-[500px] -top-64 -right-64" color="radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)" delay={0} />
     <GlowingOrb className="w-80 h-80 top-1/3 -left-40" color="radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" delay={1} />
     <GlowingOrb className="w-96 h-96 bottom-32 right-0" color="radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" delay={2} />
     <GlowingOrb className="w-64 h-64 bottom-1/4 left-1/4" color="radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)" delay={3} />
   </>
   );
 };
