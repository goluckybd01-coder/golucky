 import { motion } from "framer-motion";
 import { shouldReduceMotion } from "@/lib/reducedMotion";

 
 const SupportBackground = () => {
   return (
     <>
       {/* Gradient Background */}
       <div className="fixed inset-0 pointer-events-none">
         <div
           className="absolute inset-0"
           style={{
             background: `radial-gradient(ellipse at 20% 10%, rgba(34,197,94,0.15) 0%, transparent 50%),
                         radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.1) 0%, transparent 40%),
                         radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.08) 0%, transparent 60%)`,
           }}
         />
       </div>
 
       {/* Floating Particles */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
         {(shouldReduceMotion() ? [] : [...Array(typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 8)]).map((_, i) => (
           <motion.div
             key={i}
             className="absolute rounded-full"
             style={{
               width: Math.random() * 10 + 6,
               height: Math.random() * 10 + 6,
               left: `${Math.random() * 100}%`,
               background: i % 2 === 0 
                 ? `radial-gradient(circle, rgba(34,197,94,0.6) 0%, transparent 70%)`
                 : `radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)`,
             }}
             initial={{ y: "100vh", opacity: 0 }}
             animate={{ y: "-20vh", opacity: [0, 0.8, 0] }}
             transition={{ 
               duration: 10 + Math.random() * 5, 
               delay: i * 1.2, 
               repeat: Infinity, 
               ease: "easeOut" 
             }}
           />
         ))}
       </div>
 
       {/* Glowing Orbs */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <motion.div
           className="absolute top-20 left-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"
           animate={{ 
             scale: [1, 1.2, 1],
             opacity: [0.3, 0.5, 0.3],
           }}
           transition={{ duration: 4, repeat: Infinity }}
         />
         <motion.div
           className="absolute bottom-40 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"
           animate={{ 
             scale: [1.2, 1, 1.2],
             opacity: [0.2, 0.4, 0.2],
           }}
           transition={{ duration: 5, repeat: Infinity }}
         />
       </div>
     </>
   );
 };
 
 export default SupportBackground;
